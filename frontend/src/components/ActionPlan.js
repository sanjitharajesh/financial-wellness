import React, { useState, useEffect } from "react";
import { RECOMMENDATIONS } from "../recommendationData";
import { fetchActionItems, saveActionItem } from "../api";

const PERSONA_LABELS = {
  starting_out: "Just starting out",
  tight: "Getting by with tight margins",
  rough_patch: "Working through a rough patch",
  doing_okay: "Doing okay & mapping risks",
};

const PERSONA_BODY_LEADS = {
  starting_out: "Since you are still building habits, keep this simple and repeatable.",
  tight: "Since money is tight, keep the first step small enough to actually do.",
  rough_patch: "Since you are dealing with a rough patch, focus on stabilizing the next few weeks first.",
  doing_okay: "Since you are doing okay, use this to lower risk before it becomes urgent.",
};

const JARGON_EXPLAINERS = {
  bnpl: {
    term: "Buy Now, Pay Later (BNPL)",
    explanation:
      "Buy Now, Pay Later lets you split one purchase into smaller payments. It can be helpful, but several plans at once can feel like surprise bills hitting your account every two weeks.",
  },
  emergency_fund: {
    term: "Emergency Fund",
    explanation:
      "An emergency fund is money set aside for things like a medical bill, car repair, or job loss. You do not need to build it all at once. A separate account with $25 per paycheck is a real start.",
  },
  credit_interest: {
    term: "Credit Card Interest",
    explanation:
      "When you do not pay the full balance, the leftover amount starts charging interest. A $1,000 balance can cost about $20 a month on a 24% APR card, even before you buy anything new.",
  },
  income_stability: {
    term: "Income Stability",
    explanation:
      "Income stability means how predictable your pay is. Rent and bills show up every month, even when freelance, gig, or hourly income changes.",
  },
  financial_stress: {
    term: "Financial Stress",
    explanation:
      "Financial stress is the background worry that money is not under control. Small wins help because they give you proof that the situation can move in the right direction.",
  },
  savings_automation: {
    term: "Savings Automation",
    explanation:
      "Savings automation means money moves to savings on a set date without you deciding each time. Start with $10 or $25. The habit matters more than the amount at first.",
  },
};

function enrichRecommendationBody(rec, profile, persona) {
  if (!rec) return rec;
  const next = { ...rec, paragraphs: [...(rec.paragraphs || [])] };
  const p = profile || {};
  const st = (p.state || "").toUpperCase();
  const unstableEmp = ["freelance_gig", "part_time_hourly", "between_jobs"].includes(p.employment_type);
  const hasDependents =
    p.living_situation === "family_kids" ||
    ["have_children", "caring_parents", "both"].includes(p.family_situation || "");
  const hcol = ["NY", "NJ", "CA"].includes(st);

  if (PERSONA_BODY_LEADS[persona]) {
    next.paragraphs.unshift(PERSONA_BODY_LEADS[persona]);
  }

  if (["q7_buffer_thin", "q6_emergency_hard"].includes(rec.key)) {
    const months = unstableEmp ? 6 : 3;
    next.paragraphs.push(`For your situation, a longer-term cushion target is about ${months} months of must-pay bills.`);
  }

  if (hasDependents && ["q7_buffer_thin", "q6_emergency_hard", "q9_low_savings_discipline"].includes(rec.key)) {
    next.paragraphs.push("Because other people depend on your budget, add child or caregiver costs into your emergency target.");
  }

  if (hcol && String(rec.key).startsWith("q1_")) {
    next.paragraphs.push("Since NY, NJ, and CA can be expensive, add one extra paycheck of slack to your target if rent or childcare are big costs.");
  }

  return next;
}

function renderRichText(text) {
  return String(text || "")
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
}

function getRecommendations(result, answers, profile) {
  if (!answers) return [];

  const sub = result.sub_scores || {
    banking: result.banking_score,
    emergency: result.emergency_score,
    spending: result.spending_score,
    literacy: result.literacy_score,
  };

  const sectionOrder = Object.entries({
    banking: sub.banking,
    emergency: sub.emergency,
    spending: sub.spending,
    literacy: sub.literacy,
  })
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);

  const SECTION_MAP = {
    banking: ["Banking Access"],
    emergency: ["Emergency Preparedness"],
    spending: ["Spending Behavior"],
    literacy: ["Financial Literacy"],
  };

  const triggeredKeys = [];
  const check = (id) => {
    if (!RECOMMENDATIONS[id]) return;
    triggeredKeys.push(id);
  };

  switch (answers.q1_cash_flow) {
    case "come_up_short": check("q1_come_up_short"); break;
    case "barely_anything": check("q1_barely_anything"); break;
    case "little_inconsistent": check("q1_little_inconsistent"); break;
    default: break;
  }

  if (["varies_lot", "unpredictable_gig"].includes(answers.q2_income_stability || "")) {
    check("q2_income_unsteady");
  }

  if (["stressful_payments", "behind"].includes(answers.q5_debt || "")) {
    check("q5_debt_stressed");
  }

  if (["borrow_bnpl", "dont_know", "card_pay_next"].includes(answers.q6_emergency_resilience || "")) {
    check("q6_emergency_hard");
  }

  if (["less_than_month", "havent_thought", "one_to_two"].includes(answers.q7_emergency_buffer || "")) {
    check("q7_buffer_thin");
  }

  if (["minimum", "more_than_min"].includes(answers.q3_credit_behavior || "")) {
    check("q3_credit_carry");
  }

  if (["two_plus", "regular_large", "one_active"].includes(answers.q4_bnpl || "")) {
    check("q4_bnpl_stack");
  }

  if (["rarely_avoid", "dont_track"].includes(answers.q8_money_awareness || "")) {
    check("q8_avoid_tracking");
  }

  if (["leftover_only", "rarely_never"].includes(answers.q9_savings_behavior || "")) {
    check("q9_low_savings_discipline");
  }

  const seen = new Set();
  const triggered = [];
  triggeredKeys.forEach((key) => {
    if (seen.has(key)) return;
    seen.add(key);
    const enriched = enrichRecommendationBody({ key, ...RECOMMENDATIONS[key] }, profile, answers.persona);
    triggered.push(enriched);
  });

  triggered.sort((a, b) => {
    const sA = sectionOrder.findIndex((s) => SECTION_MAP[s]?.includes(a.section));
    const sB = sectionOrder.findIndex((s) => SECTION_MAP[s]?.includes(b.section));
    return sA - sB;
  });

  return triggered;
}

function ActionCard({ rec, index, isDone, onToggle }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [jargonOpen, setJargonOpen] = useState(false);
  const jargon = rec.jargonKey ? JARGON_EXPLAINERS[rec.jargonKey] : null;

  return (
    <li className={`action-item${isDone ? " is-done" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="action-number">{index + 1}</div>
        <div className="action-body" style={{ flex: 1 }}>
          <div className="action-section-tag">{rec.section}</div>
          <strong className="action-title">{rec.title}</strong>
          <p className="action-problem">{renderRichText(rec.problem || rec.body)}</p>

          {(rec.paragraphs || []).map((paragraph, pIndex) => (
            <p className="action-desc" key={`paragraph-${pIndex}`}>
              {renderRichText(paragraph)}
            </p>
          ))}

          {rec.bullets && rec.bullets.length > 0 && (
            <ul className="action-bullets">
              {rec.bullets.map((bullet, bIndex) => (
                <li key={`bullet-${bIndex}`}>{renderRichText(bullet)}</li>
              ))}
            </ul>
          )}

          {rec.research && <p className="action-research">{renderRichText(rec.research)}</p>}

          <button type="button" className="why-toggle" onClick={() => setWhyOpen((o) => !o)}>
            {whyOpen ? "▼" : "▶"} Why this matters
          </button>
          {whyOpen && <div className="why-content">{rec.why}</div>}

          {jargon && (
            <div className="jargon-section">
              <button
                type="button"
                className="jargon-toggle"
                onClick={() => setJargonOpen((o) => !o)}
              >
                {jargonOpen ? "▼" : "▶"} Do you know what this means? <em>{jargon.term}</em>
              </button>
              {jargonOpen && (
                <div className="jargon-panel">
                  <strong className="jargon-term">{jargon.term}</strong>
                  <p className="jargon-text">{jargon.explanation}</p>
                </div>
              )}
            </div>
          )}

          {rec.doFirst && (
            <p className="do-first">
              <strong>Do this first:</strong> {renderRichText(rec.doFirst)}
            </p>
          )}

          <div className="done-row">
            <input
              type="checkbox"
              id={`done-${rec.key}`}
              className="done-checkbox"
              checked={isDone}
              onChange={(e) => onToggle(rec.key, e.target.checked)}
            />
            <label
              htmlFor={`done-${rec.key}`}
              className={`done-label${isDone ? " is-done" : ""}`}
            >
              {isDone ? "Completed" : "Mark as done"}
            </label>
          </div>
        </div>
      </div>
    </li>
  );
}

const RISK_CONCERN_DATA = {
  banking: {
    name: "Banking Access",
    finding:
      "Your cash flow needs the most attention because a small surprise could force you to borrow.",
  },
  emergency: {
    name: "Emergency Preparedness",
    finding:
      "Your emergency setup needs work because one unexpected bill could knock the rest of the month off track.",
  },
  spending: {
    name: "Spending Behavior",
    finding:
      "Your spending habits need attention because small payments and balances can quietly stack up.",
  },
  literacy: {
    name: "Financial Literacy",
    finding:
      "Your money awareness needs attention because it is hard to fix spending you cannot clearly see.",
  },
};

const TIER_SUMMARIES = {
  Low: "You are in a relatively stable financial position, but there are areas worth strengthening.",
  Medium:
    "You are managing, but a few areas could get expensive if you ignore them.",
  High:
    "Several areas need attention. The situation can still improve, but starting now matters.",
};

function PersonalizedSummary({ result, profile }) {
  if (!result) return null;

  const firstName = (profile?.full_name || "").split(" ")[0] || null;
  const tier = result.risk_tier || "Medium";

  const sub = result.sub_scores || {
    banking: result.banking_score || 0,
    emergency: result.emergency_score || 0,
    spending: result.spending_score || 0,
    literacy: result.literacy_score || 0,
  };

  const sorted = Object.entries(sub)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort((a, b) => b[1] - a[1]);

  const concerns = sorted.slice(0, 2).map(([key]) => RISK_CONCERN_DATA[key]).filter(Boolean);

  return (
    <div className="ap-summary">
      <h2 className="ap-summary-name">
        {firstName ? `${firstName}'s Financial Wellness Assessment` : "Your Financial Wellness Assessment"}
      </h2>

      <p className="ap-summary-para">{TIER_SUMMARIES[tier] || TIER_SUMMARIES.Medium}</p>

      {concerns.length > 0 && (
        <div className="ap-concern-block">
          {concerns.map((c) => (
            <div key={c.name} className="ap-concern-item">
              <span className="ap-concern-label">{c.name}</span>
              <p className="ap-concern-text">{c.finding}</p>
            </div>
          ))}
        </div>
      )}

      <p className="ap-summary-para ap-summary-transition">
        Below is a prioritized action plan based on your answers.
      </p>
    </div>
  );
}

export default function ActionPlan({ result, answers, profile, onBack }) {
  const [doneItems, setDoneItems] = useState({});

  useEffect(() => {
    fetchActionItems()
      .then(({ data }) => setDoneItems(data))
      .catch(() => {});
  }, []);

  const handleToggle = (key, done) => {
    setDoneItems((prev) => ({ ...prev, [key]: done }));
    saveActionItem(key, done).catch(() => {});
  };

  const recs = getRecommendations(result, answers, profile);
  const doneCount = recs.filter((r) => doneItems[r.key]).length;

  return (
    <div className="action-plan-card">
      <PersonalizedSummary result={result} profile={profile} />

      <div className="ap-progress-row">
        <h2 className="action-plan-title">Your Action Plan</h2>
        {recs.length > 0 && (
          <span className="ap-progress-counter">
            {doneCount}/{recs.length} completed
          </span>
        )}
      </div>
      <p className="action-plan-sub">Tailored priority list based on your answers</p>

      {recs.length === 0 ? (
        <p className="no-factors" style={{ marginTop: "1.5rem" }}>
          No high-priority actions identified. Nice work keeping fundamentals steady.
        </p>
      ) : (
        <ol className="action-list action-grid">
          {recs.map((rec, i) => (
            <ActionCard
              key={rec.key}
              rec={rec}
              index={i}
              isDone={!!doneItems[rec.key]}
              onToggle={handleToggle}
            />
          ))}
        </ol>
      )}

      <button type="button" className="btn-secondary" onClick={onBack} style={{ marginTop: "1rem" }}>
        Back to Results
      </button>
    </div>
  );
}
