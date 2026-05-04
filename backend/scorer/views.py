from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count
from django.db.models.functions import TruncWeek

from .models import Assessment, ActionItem, UserProfile
from .serializers import (
    AssessmentInputSerializer,
    AssessmentResultSerializer,
    AssessmentHistorySerializer,
    UserProfileSerializer,
    profile_context_dict,
)
from .scoring import compute_scores, get_risk_tier


TRACK_PROFILE_KEYS = ("employment_type", "state", "family_situation")


def _scores_for_assessment_instance(assessment, profile_row):
    prof = profile_context_dict(profile_row)
    answers = {
        "q1_cash_flow": assessment.q1_cash_flow,
        "q2_income_stability": assessment.q2_income_stability,
        "q3_credit_behavior": assessment.q3_credit_behavior,
        "q4_bnpl": assessment.q4_bnpl,
        "q5_debt": assessment.q5_debt,
        "q6_emergency_resilience": assessment.q6_emergency_resilience,
        "q7_emergency_buffer": assessment.q7_emergency_buffer,
        "q8_money_awareness": assessment.q8_money_awareness,
        "q9_savings_behavior": assessment.q9_savings_behavior,
    }
    return compute_scores(answers, prof)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)

    def put(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        old = tuple(getattr(profile, k) or "" for k in TRACK_PROFILE_KEYS)

        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        profile.refresh_from_db()

        new = tuple(getattr(profile, k) or "" for k in TRACK_PROFILE_KEYS)
        had_prior = any(bool(x) for x in old)
        situation_changed = (not created) and had_prior and (old != new)

        payload = serializer.data.copy()
        payload["situation_changed"] = situation_changed
        payload["situation_message"] = (
            "Your situation has changed, consider retaking your assessment."
            if situation_changed
            else ""
        )
        return Response(payload, status=status.HTTP_200_OK)


class ScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile_row = None
        try:
            profile_row = request.user.userprofile
        except UserProfile.DoesNotExist:
            pass
        profile_dict = profile_context_dict(profile_row)

        serializer = AssessmentInputSerializer(
            data=request.data,
            context={"profile": profile_dict},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        scores = compute_scores(data, profile_dict)
        risk_tier = get_risk_tier(scores["score"])

        assessment = Assessment.objects.create(
            user=request.user,
            persona=data["persona"],
            q1_cash_flow=data["q1_cash_flow"],
            q2_income_stability=data.get("q2_income_stability") or "",
            q3_credit_behavior=data["q3_credit_behavior"],
            q4_bnpl=data["q4_bnpl"],
            q5_debt=data.get("q5_debt") or "",
            q6_emergency_resilience=data["q6_emergency_resilience"],
            q7_emergency_buffer=data["q7_emergency_buffer"],
            q8_money_awareness=data["q8_money_awareness"],
            q9_savings_behavior=data["q9_savings_behavior"],
            banking_score=scores["banking_score"],
            emergency_score=scores["emergency_score"],
            spending_score=scores["spending_score"],
            literacy_score=scores["literacy_score"],
            score=scores["score"],
            risk_tier=risk_tier,
        )

        result_serializer = AssessmentResultSerializer(
            assessment,
            context={"breakdown": scores["breakdown"]},
        )
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


class StatsView(APIView):
    def get(self, request):
        assessments = Assessment.objects.all()
        total = Assessment.objects.count()
        dist_map = {"Low": 0, "Medium": 0, "High": 0}
        for score in assessments.values_list("score", flat=True):
            dist_map[get_risk_tier(score)] += 1

        avg_overall = assessments.aggregate(avg=Avg("score"))["avg"]

        avgs = Assessment.objects.aggregate(
            banking=Avg("banking_score"),
            emergency=Avg("emergency_score"),
            spending=Avg("spending_score"),
            literacy=Avg("literacy_score"),
        )
        section_averages = {
            k: round(v, 1) if v is not None else 0 for k, v in avgs.items()
        }

        def question_counts(field):
            counts = (
                Assessment.objects
                .exclude(**{field: ""})
                .values(field)
                .annotate(count=Count("id"))
            )
            return {item[field]: item["count"] for item in counts}

        def profile_average(field, limit=None, order_by_count=False):
            qs = (
                Assessment.objects
                .filter(**{f"user__userprofile__{field}__isnull": False})
                .exclude(**{f"user__userprofile__{field}": ""})
                .values(f"user__userprofile__{field}")
                .annotate(avg_score=Avg("score"), count=Count("id"))
            )
            qs = qs.order_by("-count" if order_by_count else f"user__userprofile__{field}")
            if limit:
                qs = qs[:limit]
            return [
                {
                    "value": item[f"user__userprofile__{field}"],
                    "avg_score": round(item["avg_score"], 1) if item["avg_score"] is not None else 0,
                    "count": item["count"],
                }
                for item in qs
            ]

        trend = (
            assessments
            .annotate(week=TruncWeek("created_at"))
            .values("week")
            .annotate(avg_score=Avg("score"), count=Count("id"))
            .order_by("week")
        )
        score_trend = [
            {
                "week": item["week"].date().isoformat() if item["week"] else "",
                "avg_score": round(item["avg_score"], 1) if item["avg_score"] is not None else 0,
                "count": item["count"],
            }
            for item in trend
        ]

        return Response(
            {
                "distribution": {
                    "Low": dist_map.get("Low", 0),
                    "Medium": dist_map.get("Medium", 0),
                    "High": dist_map.get("High", 0),
                },
                "total": total,
                "average_score": round(avg_overall, 1) if avg_overall is not None else 0,
                "average_tier": get_risk_tier(avg_overall or 0),
                "score_trend": score_trend,
                "profile_breakdowns": {
                    "age_range": profile_average("age_range"),
                    "state": profile_average("state", limit=5, order_by_count=True),
                    "employment_type": profile_average("employment_type"),
                },
                "section_averages": section_averages,
                "question_breakdown": {
                    "q6_emergency_resilience": question_counts("q6_emergency_resilience"),
                    "q4_bnpl": question_counts("q4_bnpl"),
                    "q9_savings_behavior": question_counts("q9_savings_behavior"),
                },
            }
        )


class HistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        assessments = Assessment.objects.filter(user=request.user).order_by("created_at")
        serializer = AssessmentHistorySerializer(assessments, many=True)
        return Response(serializer.data)


class LatestScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        assessment = Assessment.objects.filter(user=request.user).first()
        if not assessment:
            return Response({"detail": "No assessments found."}, status=status.HTTP_404_NOT_FOUND)

        profile_row = None
        try:
            profile_row = request.user.userprofile
        except UserProfile.DoesNotExist:
            pass

        scores = _scores_for_assessment_instance(assessment, profile_row)
        serializer = AssessmentResultSerializer(
            assessment,
            context={"breakdown": scores["breakdown"]},
        )
        answers = {
            "persona": assessment.persona,
            "q1_cash_flow": assessment.q1_cash_flow,
            "q2_income_stability": assessment.q2_income_stability,
            "q3_credit_behavior": assessment.q3_credit_behavior,
            "q4_bnpl": assessment.q4_bnpl,
            "q5_debt": assessment.q5_debt,
            "q6_emergency_resilience": assessment.q6_emergency_resilience,
            "q7_emergency_buffer": assessment.q7_emergency_buffer,
            "q8_money_awareness": assessment.q8_money_awareness,
            "q9_savings_behavior": assessment.q9_savings_behavior,
        }
        result = serializer.data.copy()
        result["score"] = scores["score"]
        result["risk_tier"] = get_risk_tier(scores["score"])
        return Response({**result, "answers": answers})

class ActionItemView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = ActionItem.objects.filter(user=request.user)
        return Response({item.key: item.done for item in items})

    def post(self, request):
        key = request.data.get("key", "").strip()
        done = bool(request.data.get("done", False))
        if not key:
            return Response({"error": "key is required"}, status=status.HTTP_400_BAD_REQUEST)
        item, _ = ActionItem.objects.update_or_create(
            user=request.user, key=key, defaults={"done": done}
        )
        return Response({"key": item.key, "done": item.done})
