"""
Risk scoring for the redesigned assessment. Raw points summed per answered question;
risk tiers use raw thresholds: Low 0-50, Medium 51-95, High 96+.
Mirrored in frontend/src/scoring.js
"""

FIELD_POINTS = {
    "q1_cash_flow": {
        "save_comfortable": 0,
        "little_inconsistent": 10,
        "barely_anything": 20,
        "come_up_short": 30,
    },
    "q2_income_stability": {
        "very_consistent": 0,
        "mostly_consistent": 5,
        "varies_lot": 15,
        "unpredictable_gig": 20,
    },
    "q3_credit_behavior": {
        "paid_full": 0,
        "more_than_min": 10,
        "minimum": 20,
        "no_cc": 5,
    },
    "q4_bnpl": {
        "none": 0,
        "one_active": 10,
        "two_plus": 20,
        "regular_large": 25,
    },
    "q5_debt": {
        "none_significant": 0,
        "manageable_plan": 5,
        "stressful_payments": 15,
        "behind": 25,
    },
    "q6_emergency_resilience": {
        "savings_easily": 0,
        "card_pay_next": 10,
        "borrow_bnpl": 20,
        "dont_know": 30,
    },
    "q7_emergency_buffer": {
        "three_plus": 0,
        "one_to_two": 15,
        "less_than_month": 25,
        "havent_thought": 30,
    },
    "q8_money_awareness": {
        "daily": 0,
        "weekly": 5,
        "rarely_avoid": 20,
        "dont_track": 25,
    },
    "q9_savings_behavior": {
        "automatic": 0,
        "intentional_manual": 5,
        "leftover_only": 15,
        "rarely_never": 25,
    },
}


def max_points(field):
    return max(FIELD_POINTS[field].values())


FIELD_LABELS = {
    "q1_cash_flow": {
        "save_comfortable": "Comfortable leftover after necessities",
        "little_inconsistent": "A little leftover, inconsistently",
        "barely_anything": "Barely anything left most months",
        "come_up_short": "Usually comes up short each month",
    },
    "q2_income_stability": {
        "very_consistent": "Income is very consistent",
        "mostly_consistent": "Mostly consistent income",
        "varies_lot": "Income varies a lot month to month",
        "unpredictable_gig": "Unpredictable gig/contract income",
    },
    "q3_credit_behavior": {
        "paid_full": "Credit cards paid in full",
        "more_than_min": "Pays more than minimum",
        "minimum": "Usually pays the minimum",
        "no_cc": "No credit card",
    },
    "q4_bnpl": {
        "none": "No active BNPL",
        "one_active": "One BNPL plan active",
        "two_plus": "Two or more BNPL plans",
        "regular_large": "Uses BNPL regularly for large buys",
    },
    "q5_debt": {
        "none_significant": "No significant debt",
        "manageable_plan": "Debt is manageable, on a plan",
        "stressful_payments": "Stressful debt but making payments",
        "behind": "Behind on payments",
    },
    "q6_emergency_resilience": {
        "savings_easily": "$900 repair covered from savings",
        "card_pay_next": "Would use card, pay off next month",
        "borrow_bnpl": "Would need to borrow or use BNPL",
        "dont_know": "Uncertain how $900 expense would be covered",
    },
    "q7_emergency_buffer": {
        "three_plus": "Could cover 3+ months without income",
        "one_to_two": "Could cover 1-2 months",
        "less_than_month": "Less than one month of expenses",
        "havent_thought": "Hasn't thought about income-loss buffer",
    },
    "q8_money_awareness": {
        "daily": "Checks balances / tracks regularly",
        "weekly": "Reviews money about weekly",
        "rarely_avoid": "Rarely checks, tends to avoid",
        "dont_track": "Does not track spending",
    },
    "q9_savings_behavior": {
        "automatic": "Saves automatically each month",
        "intentional_manual": "Saves intentionally (manual)",
        "leftover_only": "Only saves when there's leftover",
        "rarely_never": "Rarely or never sets savings aside",
    },
}

SECTION_FIELDS = {
    "Banking Access": ["q1_cash_flow"],
    "Emergency Preparedness": ["q2_income_stability", "q5_debt", "q6_emergency_resilience", "q7_emergency_buffer"],
    "Spending Behavior": ["q3_credit_behavior", "q4_bnpl"],
    "Financial Literacy": ["q8_money_awareness", "q9_savings_behavior"],
}

SECTION_BY_FIELD = {}
for sect, keys in SECTION_FIELDS.items():
    for k in keys:
        SECTION_BY_FIELD[k] = sect


def should_show_q2_income(profile):
    if not profile:
        return True  # employment unknown, show question
    et = profile.get("employment_type") or ""
    return et != "full_time_salaried"


def should_show_q5_debt(profile):
    if not profile:
        return False
    ar = profile.get("age_range") or ""
    return ar in ("18_24", "25_30")


def active_fields(profile):
    fields = ["q1_cash_flow", "q3_credit_behavior", "q4_bnpl", "q6_emergency_resilience",
              "q7_emergency_buffer", "q8_money_awareness", "q9_savings_behavior"]
    if should_show_q2_income(profile):
        fields.append("q2_income_stability")
    if should_show_q5_debt(profile):
        fields.append("q5_debt")
    return fields


def _breakdown_entries(answers, profile):
    items = []
    for field in active_fields(profile):
        val = answers.get(field) or ""
        if not val:
            continue
        pts = FIELD_POINTS[field].get(val, 0)
        if pts > 0:
            label = FIELD_LABELS.get(field, {}).get(val, val)
            items.append({
                "factor": label,
                "key": f"{field}_{val}",
                "section": SECTION_BY_FIELD[field],
                "points": pts,
            })
    items.sort(key=lambda x: x["points"], reverse=True)
    return items


def _section_raw_totals(answers, profile):
    totals = {"Banking Access": 0, "Emergency Preparedness": 0,
              "Spending Behavior": 0, "Financial Literacy": 0}
    max_totals = {k: 0 for k in totals}
    for field in active_fields(profile):
        section = SECTION_BY_FIELD[field]
        max_totals[section] += max_points(field)
        val = answers.get(field) or ""
        if val:
            totals[section] += FIELD_POINTS[field].get(val, 0)
    return totals, max_totals


def compute_scores(answers, profile=None):
    profile = profile or {}
    total = 0
    for field in active_fields(profile):
        val = answers.get(field) or ""
        if val:
            total += FIELD_POINTS[field].get(val, 0)

    section_raw, section_max = _section_raw_totals(answers, profile)
    sub_scores = {}
    for sect in section_raw:
        mx = section_max[sect]
        raw = section_raw[sect]
        sub_scores[_section_key(sect)] = round((raw / mx * 100) if mx else 0)

    breakdown = _breakdown_entries(answers, profile)

    return {
        "banking_score": sub_scores["banking"],
        "emergency_score": sub_scores["emergency"],
        "spending_score": sub_scores["spending"],
        "literacy_score": sub_scores["literacy"],
        "score": total,
        "breakdown": breakdown,
    }


def _section_key(section_name):
    return {
        "Banking Access": "banking",
        "Emergency Preparedness": "emergency",
        "Spending Behavior": "spending",
        "Financial Literacy": "literacy",
    }[section_name]


def get_risk_tier(raw_score):
    if raw_score <= 50:
        return "Low"
    if raw_score <= 95:
        return "Medium"
    return "High"
