// Mirrors backend/scorer/scoring.js. Raw risk points summed; tiers 0-50 Low, 51-95 Medium, 96+ High.

export const FIELD_POINTS = {
  q1_cash_flow: {
    save_comfortable: 0,
    little_inconsistent: 10,
    barely_anything: 20,
    come_up_short: 30,
  },
  q2_income_stability: {
    very_consistent: 0,
    mostly_consistent: 5,
    varies_lot: 15,
    unpredictable_gig: 20,
  },
  q3_credit_behavior: {
    paid_full: 0,
    more_than_min: 10,
    minimum: 20,
    no_cc: 5,
  },
  q4_bnpl: {
    none: 0,
    one_active: 10,
    two_plus: 20,
    regular_large: 25,
  },
  q5_debt: {
    none_significant: 0,
    manageable_plan: 5,
    stressful_payments: 15,
    behind: 25,
  },
  q6_emergency_resilience: {
    savings_easily: 0,
    card_pay_next: 10,
    borrow_bnpl: 20,
    dont_know: 30,
  },
  q7_emergency_buffer: {
    three_plus: 0,
    one_to_two: 15,
    less_than_month: 25,
    havent_thought: 30,
  },
  q8_money_awareness: {
    daily: 0,
    weekly: 5,
    rarely_avoid: 20,
    dont_track: 25,
  },
  q9_savings_behavior: {
    automatic: 0,
    intentional_manual: 5,
    leftover_only: 15,
    rarely_never: 25,
  },
};

const SECTION_FIELDS = {
  "Banking Access": ["q1_cash_flow"],
  "Emergency Preparedness": ["q2_income_stability", "q5_debt", "q6_emergency_resilience", "q7_emergency_buffer"],
  "Spending Behavior": ["q3_credit_behavior", "q4_bnpl"],
  "Financial Literacy": ["q8_money_awareness", "q9_savings_behavior"],
};

function sectionKey(sectionName) {
  return (
    {
      "Banking Access": "banking",
      "Emergency Preparedness": "emergency",
      "Spending Behavior": "spending",
      "Financial Literacy": "literacy",
    }[sectionName] || ""
  );
}

/** API profile snapshot → scorer profile dict */
export function scoringProfile(profile) {
  if (!profile) return null;
  return {
    employment_type: profile.employment_type || "",
    age_range: profile.age_range || "",
    state: profile.state || "",
    living_situation: profile.living_situation || "",
    family_situation: profile.family_situation || "",
  };
}

export function shouldShowIncomeStability(profile) {
  const p = scoringProfile(profile);
  if (!p) return true;
  return p.employment_type !== "full_time_salaried";
}

export function shouldShowDebtQuestion(profile) {
  const p = scoringProfile(profile);
  if (!p) return false;
  return p.age_range === "18_24" || p.age_range === "25_30";
}

export function activeFields(profile) {
  const prof = scoringProfile(profile);
  const fields = [
    "q1_cash_flow",
    "q3_credit_behavior",
    "q4_bnpl",
    "q6_emergency_resilience",
    "q7_emergency_buffer",
    "q8_money_awareness",
    "q9_savings_behavior",
  ];
  if (shouldShowIncomeStability(profile)) fields.push("q2_income_stability");
  if (shouldShowDebtQuestion(profile)) fields.push("q5_debt");
  return fields;
}

function maxPoints(field) {
  return Math.max(...Object.values(FIELD_POINTS[field]));
}

const SECTION_BY_FIELD = {};
Object.entries(SECTION_FIELDS).forEach(([sect, keys]) => {
  keys.forEach((k) => {
    SECTION_BY_FIELD[k] = sect;
  });
});

function sectionRawTotals(answers, profile) {
  const totals = {
    "Banking Access": 0,
    "Emergency Preparedness": 0,
    "Spending Behavior": 0,
    "Financial Literacy": 0,
  };
  const maxTotals = { ...totals };
  activeFields(profile).forEach((field) => {
    const section = SECTION_BY_FIELD[field];
    maxTotals[section] += maxPoints(field);
    const val = answers[field] || "";
    if (val) totals[section] += FIELD_POINTS[field][val] ?? 0;
  });
  return { totals, maxTotals };
}

export function computeScores(answers, profile = null) {
  let total = 0;
  activeFields(profile).forEach((field) => {
    const val = answers[field] || "";
    if (val) total += FIELD_POINTS[field][val] ?? 0;
  });
  const { totals, maxTotals } = sectionRawTotals(answers, profile);
  const sub = {};
  Object.keys(totals).forEach((sect) => {
    const mx = maxTotals[sect];
    sub[sectionKey(sect)] = mx ? Math.round((totals[sect] / mx) * 100) : 0;
  });
  return {
    banking: sub.banking,
    emergency: sub.emergency,
    spending: sub.spending,
    literacy: sub.literacy,
    overall: total,
  };
}

export function getRiskTier(rawScore) {
  if (rawScore <= 50) return "Low";
  if (rawScore <= 95) return "Medium";
  return "High";
}
