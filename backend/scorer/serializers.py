from rest_framework import serializers

from .models import Assessment, UserProfile
from .scoring import FIELD_POINTS, active_fields


US_STATE_CODES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]


class UserProfileSerializer(serializers.ModelSerializer):
    incomplete = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "full_name",
            "age_range",
            "state",
            "employment_type",
            "living_situation",
            "family_situation",
            "incomplete",
            "updated_at",
        ]
        read_only_fields = ("updated_at", "incomplete")

    def get_incomplete(self, obj):
        return not obj.is_complete()

    def validate_state(self, value):
        v = (value or "").strip().upper()
        if not v:
            return ""
        if v not in US_STATE_CODES:
            raise serializers.ValidationError("Select a valid U.S. state.")
        return v


def profile_context_dict(profile):
    if not profile:
        return None
    return {
        "employment_type": profile.employment_type,
        "age_range": profile.age_range,
        "state": profile.state,
        "living_situation": profile.living_situation,
        "family_situation": profile.family_situation,
    }


class AssessmentInputSerializer(serializers.Serializer):
    persona = serializers.ChoiceField(
        choices=["starting_out", "tight", "rough_patch", "doing_okay"]
    )

    q1_cash_flow = serializers.CharField()
    q2_income_stability = serializers.CharField(required=False, allow_blank=True)
    q3_credit_behavior = serializers.CharField()
    q4_bnpl = serializers.CharField()
    q5_debt = serializers.CharField(required=False, allow_blank=True)
    q6_emergency_resilience = serializers.CharField()
    q7_emergency_buffer = serializers.CharField()
    q8_money_awareness = serializers.CharField()
    q9_savings_behavior = serializers.CharField()

    def validate(self, data):
        profile = self.context.get("profile") or {}
        req = active_fields(profile)
        field_errors = {}
        for field in req:
            if not (data.get(field) or "").strip():
                field_errors[field] = "This field is required for your profile."

        if field_errors:
            raise serializers.ValidationError(field_errors)

        for field in req:
            val = (data.get(field) or "").strip()
            if val not in FIELD_POINTS[field]:
                field_errors[field] = f"Invalid choice: {val!r}."

        optional = set(FIELD_POINTS.keys()) - set(req)
        for field in optional:
            val = (data.get(field) or "").strip()
            if val and val not in FIELD_POINTS[field]:
                field_errors[field] = f"Invalid choice: {val!r}."

        if field_errors:
            raise serializers.ValidationError(field_errors)

        return data


class AssessmentResultSerializer(serializers.ModelSerializer):
    breakdown = serializers.SerializerMethodField()
    sub_scores = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            "id",
            "persona",
            "risk_tier",
            "score",
            "banking_score",
            "emergency_score",
            "spending_score",
            "literacy_score",
            "sub_scores",
            "breakdown",
            "created_at",
        ]

    def get_breakdown(self, obj):
        return self.context.get("breakdown", [])

    def get_sub_scores(self, obj):
        return {
            "banking": obj.banking_score,
            "emergency": obj.emergency_score,
            "spending": obj.spending_score,
            "literacy": obj.literacy_score,
        }


class AssessmentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = [
            "id",
            "persona",
            "score",
            "risk_tier",
            "banking_score",
            "emergency_score",
            "spending_score",
            "literacy_score",
            "created_at",
        ]
