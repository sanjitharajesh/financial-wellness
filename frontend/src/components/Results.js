import React, { useState, useEffect } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { computeScores, getRiskTier } from "../scoring";
import { fetchLatestScore } from "../api";

const TIER_META = {
  Low: { color: "#4A7C59", bg: "#EEF4F0", border: "#A8C8B0", label: "Low Risk" },
  Medium: { color: "#C9A84C", bg: "#FBF7EC", border: "#E8D4A0", label: "Medium Risk" },
  High: { color: "#8B3A3A", bg: "#F7EEEE", border: "#D4ABAB", label: "High Risk" },
};

const SECTION_QUESTIONS = {
  banking: {
    q1_cash_flow: [
      { value: "save_comfortable", label: "Enough to save comfortably" },
      { value: "little_inconsistent", label: "A little, nothing consistent" },
      { value: "barely_anything", label: "Barely anything" },
      { value: "come_up_short", label: "Usually comes up short" },
    ],
  },
  emergency: {
    q2_income_stability: [
      { value: "", label: "(not asked / skip)" },
      { value: "very_consistent", label: "Very consistent" },
      { value: "mostly_consistent", label: "Mostly consistent" },
      { value: "varies_lot", label: "Varies a lot" },
      { value: "unpredictable_gig", label: "Unpredictable gig/contract" },
    ],
    q5_debt: [
      { value: "", label: "(not asked / skip)" },
      { value: "none_significant", label: "No significant debt" },
      { value: "manageable_plan", label: "Manageable, on plan" },
      { value: "stressful_payments", label: "Stressful, paying" },
      { value: "behind", label: "Behind on payments" },
    ],
    q6_emergency_resilience: [
      { value: "savings_easily", label: "$900 from savings easily" },
      { value: "card_pay_next", label: "Card, pay next month" },
      { value: "borrow_bnpl", label: "Borrow or BNPL" },
      { value: "dont_know", label: "Don't know what I'd do" },
    ],
    q7_emergency_buffer: [
      { value: "three_plus", label: "3+ months runway" },
      { value: "one_to_two", label: "1-2 months" },
      { value: "less_than_month", label: "<1 month" },
      { value: "havent_thought", label: "Haven't thought about it" },
    ],
  },
  spending: {
    q3_credit_behavior: [
      { value: "paid_full", label: "Paid in full monthly" },
      { value: "more_than_min", label: "More than minimum" },
      { value: "minimum", label: "Minimum only" },
      { value: "no_cc", label: "No credit card" },
    ],
    q4_bnpl: [
      { value: "none", label: "No BNPL plans" },
      { value: "one_active", label: "One active plan" },
      { value: "two_plus", label: "Two or more plans" },
      { value: "regular_large", label: "BNPL frequently for large buys" },
    ],
  },
  literacy: {
    q8_money_awareness: [
      { value: "daily", label: "Daily / regularly" },
      { value: "weekly", label: "Weekly check-ins" },
      { value: "rarely_avoid", label: "Rarely, avoid looking" },
      { value: "dont_track", label: "Don't track" },
    ],
    q9_savings_behavior: [
      { value: "automatic", label: "Automatic transfers" },
      { value: "intentional_manual", label: "Intentional manual" },
      { value: "leftover_only", label: "Only when leftover exists" },
      { value: "rarely_never", label: "Rarely / never" },
    ],
  },
};

const SECTION_LABELS = {
  banking: "Banking Access",
  emergency: "Emergency Preparedness",
  spending: "Spending Behavior",
  literacy: "Financial Literacy",
};

function RadarDisplay({ sub }) {
  const data = [
    { subject: "Banking", value: 100 - sub.banking },
    { subject: "Emergency", value: 100 - sub.emergency },
    { subject: "Spending", value: 100 - sub.spending },
    { subject: "Literacy", value: 100 - sub.literacy },
  ];
  return (
    <div className="radar-container">
      <p className="radar-label">Section strength (higher = healthier)</p>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#E8E8E0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#5A5A5A" }} />
          <Radar
            name="Strength"
            dataKey="value"
            stroke="#4A7C59"
            fill="#4A7C59"
            fillOpacity={0.2}
          />
          <Tooltip formatter={(v) => [`${v}/100`, "Strength"]} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Simulator({ originalAnswers, profile }) {
  const [simAnswers, setSimAnswers] = useState({ ...originalAnswers });
  const simScores = computeScores(simAnswers, profile);
  const simTier = getRiskTier(simScores.overall);
  const origScores = computeScores(originalAnswers, profile);
  const delta = simScores.overall - origScores.overall;
  const changed = Object.keys(simAnswers).some((k) => simAnswers[k] !== originalAnswers[k]);

  return (
    <div className="simulator-section">
      <h3>Before / After Simulator</h3>
      <p className="simulator-desc">
        Toggle answers to see how your total risk points would shift. Tiers: Low 0-50, Medium 51-95,
        High 96+.
      </p>

      {Object.entries(SECTION_QUESTIONS).map(([sectionKey, questions]) => (
        <div key={sectionKey} className="sim-section-block">
          <p className="sim-section-title">{SECTION_LABELS[sectionKey]}</p>
          {Object.entries(questions).map(([field, options]) => (
            <div key={field} className="sim-field-row">
              <span className="sim-field-label">{field.replace(/_/g, " ")}</span>
              <select
                className="sim-select"
                value={simAnswers[field] ?? ""}
                onChange={(e) =>
                  setSimAnswers((prev) => ({ ...prev, [field]: e.target.value }))
                }
              >
                {options.map((o) => (
                  <option key={`${field}-${o.value || "blank"}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ))}

      {changed && (
        <div
          className="sim-result"
          style={{
            background: TIER_META[simTier]?.bg,
            border: `2px solid ${TIER_META[simTier]?.border}`,
            color: TIER_META[simTier]?.color,
          }}
        >
          <span>
            Simulated risk points: <strong>{simScores.overall}</strong> ({simTier} Risk)
          </span>
          <span className="sim-delta">
            {delta === 0
              ? "No change"
              : delta > 0
              ? `+${delta} pts (higher risk)`
              : `${delta} pts (lower risk)`}
          </span>
        </div>
      )}
    </div>
  );
}

const TIER_MESSAGES = {
  Low: "Structural risks look contained. Reinforce the routines that got you here.",
  Medium:
    "Stress points ahead. Usually solvable when you tighten one habit and one cushion at a time.",
  High:
    "Multiple pressure points surfaced. Use the prioritized action cards to stabilize cash flow quickly.",
};

export default function Results({
  result: resultProp,
  answers: answersProp,
  profile,
  onRestart,
  onActionPlan,
  onResultFetched,
}) {
  const [result, setResult] = useState(resultProp || null);
  const [answers, setAnswers] = useState(answersProp || null);
  const [loading, setLoading] = useState(!resultProp);
  const [error, setError] = useState(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  useEffect(() => {
    if (resultProp) return;
    fetchLatestScore()
      .then(({ data }) => {
        const { answers: fetchedAnswers, ...fetchedResult } = data;
        setResult(fetchedResult);
        setAnswers(fetchedAnswers);
        if (onResultFetched) onResultFetched(fetchedResult, fetchedAnswers);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setError("no_assessments");
        } else {
          setError("Could not load your latest results.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="results-card">
        <p style={{ color: "#5A5A5A" }}>Loading results…</p>
      </div>
    );
  }

  if (error === "no_assessments") {
    return (
      <div className="results-card" style={{ textAlign: "center", padding: "3rem" }}>
        <p style={{ color: "#5A5A5A", marginBottom: "1.5rem" }}>
          You haven&apos;t taken an assessment yet.
        </p>
        <button type="button" className="btn-primary" onClick={onRestart}>
          Start Assessment
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-card" style={{ textAlign: "center", padding: "3rem" }}>
        <p className="error-msg" style={{ marginBottom: "1.5rem" }}>
          {error}
        </p>
        <button type="button" className="btn-primary" onClick={onRestart}>
          Start Assessment
        </button>
      </div>
    );
  }

  if (!result) return null;

  const tier = TIER_META[result.risk_tier] || TIER_META.Medium;
  const sub = result.sub_scores || {
    banking: result.banking_score,
    emergency: result.emergency_score,
    spending: result.spending_score,
    literacy: result.literacy_score,
  };

  return (
    <div>
      <div className="results-summary">
        <p className="tier-label" style={{ color: tier.color }}>{tier.label}</p>
        <p className="tier-score">{result.score} risk points</p>
        <p className="tier-hint">Low 0-50 | Medium 51-95 | High 96+</p>
        <p className="tier-message">{TIER_MESSAGES[result.risk_tier]}</p>
      </div>

      <div className="dashboard-row">
        <div className="dashboard-panel">
          <section className="breakdown-section">
            <h3>Section Risk Intensity</h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "-0.25rem" }}>
              Bars show modeled risk burden per pillar (not the raw summed points).
            </p>
            <div className="subscore-grid">
              {[
                { label: "Banking Access", val: sub.banking },
                { label: "Emergency Prep", val: sub.emergency },
                { label: "Spending", val: sub.spending },
                { label: "Literacy", val: sub.literacy },
              ].map(({ label, val }) => (
                <div key={label} className="subscore-item">
                  <div className="subscore-bar-wrap">
                    <div
                      className="subscore-bar-fill"
                      style={{
                        width: `${val}%`,
                        background: val > 66 ? "#8B3A3A" : val > 33 ? "#C9A84C" : "#4A7C59",
                      }}
                    />
                  </div>
                  <div className="subscore-meta">
                    <span>{label}</span>
                    <span className="subscore-num">{val}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="dashboard-panel">
          <RadarDisplay sub={sub} />
        </div>
      </div>

      <div className="dashboard-full">
          <section className="breakdown-section">
            <h3>Top Risk Factors</h3>
            {result.breakdown && result.breakdown.length > 0 ? (
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Signal</th>
                    <th>Section</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.slice(0, 8).map((item, i) => (
                    <tr key={`${item.key}-${i}`}>
                      <td>{item.factor}</td>
                      <td className="section-cell">{item.section}</td>
                      <td className="points-cell">+{item.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-factors">No notable risk contributors recorded.</p>
            )}
          </section>
      </div>

      {answers && (
        <div className="dashboard-full">
          <button
            type="button"
            className="btn-secondary simulator-toggle"
            onClick={() => setSimulatorOpen((open) => !open)}
          >
            {simulatorOpen ? "Hide Before / After Simulator" : "Show Before / After Simulator"}
          </button>
          {simulatorOpen && <Simulator originalAnswers={answers} profile={profile} />}
        </div>
      )}

      <div className="results-actions">
        <button type="button" className="btn-primary" onClick={onActionPlan}>
          View Action Plan
        </button>
        <button type="button" className="btn-secondary" onClick={onRestart}>
          Retake Assessment
        </button>
      </div>
    </div>
  );
}
