import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchStats } from "../api";

const TIER_COLORS = {
  Low: "#4A7C59",
  Medium: "#C9A84C",
  High: "#8B3A3A",
};

const BAR_COLORS = ["#4A7C59", "#8AAF78", "#C9A84C", "#8B3A3A", "#3A7AB8"];

const AGE_LABELS = {
  "18_24": "18-24",
  "25_30": "25-30",
  "31_40": "31-40",
  "40_plus": "40+",
};

const EMPLOYMENT_LABELS = {
  full_time_salaried: "Salaried",
  part_time_hourly: "Hourly",
  freelance_gig: "Freelance",
  student: "Student",
  between_jobs: "Between jobs",
};

const QUESTION_LABELS = {
  q6_emergency_resilience: {
    savings_easily: "Savings easily",
    card_pay_next: "Card, pay next month",
    borrow_bnpl: "Borrow or BNPL",
    dont_know: "Do not know",
  },
  q4_bnpl: {
    none: "No plans",
    one_active: "One active",
    two_plus: "Two or more",
    regular_large: "Large purchases",
  },
  q9_savings_behavior: {
    automatic: "Automatic",
    intentional_manual: "Manual",
    leftover_only: "Leftover only",
    rarely_never: "Rarely or never",
  },
};

function riskColor(score) {
  if (score <= 50) return TIER_COLORS.Low;
  if (score <= 95) return TIER_COLORS.Medium;
  return TIER_COLORS.High;
}

function StatCard({ title, insight, children }) {
  return (
    <section className="analytics-card">
      <h3>{title}</h3>
      <div className="analytics-card-body">{children}</div>
      <p className="analytics-insight">{insight}</p>
    </section>
  );
}

function EmptyChart() {
  return <div className="analytics-empty">Not enough data yet</div>;
}

function NumberStat({ value, label, color }) {
  return (
    <div className="number-stat">
      <strong style={color ? { color } : undefined}>{value}</strong>
      {label && <span>{label}</span>}
    </div>
  );
}

function SimpleTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="stats-tooltip">
      <p className="stats-tooltip-title">{label}</p>
      {payload.map((item) => (
        <p className="stats-tooltip-row" key={item.dataKey}>
          <span>{item.name || item.dataKey}</span>
          <span className="stats-tooltip-pct">{item.value}</span>
        </p>
      ))}
    </div>
  );
}

function toProfileRows(rows = [], labels = {}) {
  return rows.map((row) => ({
    name: labels[row.value] || row.value || "Unknown",
    score: row.avg_score || 0,
    count: row.count || 0,
  }));
}

function toQuestionRows(counts = {}, labels = {}) {
  return Object.entries(labels).map(([value, label]) => ({
    name: label,
    count: counts[value] || 0,
  }));
}

function scoreInsight(avgScore, tier) {
  if (!avgScore) return "Average score will appear once assessments are submitted.";
  return `Average user is currently in the ${tier} range.`;
}

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats()
      .then(({ data }) => setStats(data))
      .catch(() => setError("Could not load statistics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="stats-card"><p>Loading statistics...</p></div>;
  if (error) return <div className="stats-card"><p className="error-msg">{error}</p></div>;

  const {
    distribution = {},
    total = 0,
    average_score = 0,
    average_tier = "Low",
    score_trend = [],
    profile_breakdowns = {},
    question_breakdown = {},
  } = stats || {};

  const ageRows = toProfileRows(profile_breakdowns.age_range, AGE_LABELS);
  const stateRows = toProfileRows(profile_breakdowns.state);
  const employmentRows = toProfileRows(profile_breakdowns.employment_type, EMPLOYMENT_LABELS);
  const emergencyRows = toQuestionRows(
    question_breakdown.q6_emergency_resilience,
    QUESTION_LABELS.q6_emergency_resilience
  );
  const bnplRows = toQuestionRows(question_breakdown.q4_bnpl, QUESTION_LABELS.q4_bnpl);
  const savingsRows = toQuestionRows(
    question_breakdown.q9_savings_behavior,
    QUESTION_LABELS.q9_savings_behavior
  );
  const tierRows = ["Low", "Medium", "High"].map((tier) => ({
    name: tier,
    count: distribution[tier] || 0,
    fill: TIER_COLORS[tier],
  }));

  return (
    <div className="stats-card analytics-dashboard">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <p className="stats-sub">Aggregate view across all submitted assessments.</p>
      </div>

      {total === 0 ? (
        <p className="no-data">No assessments yet. Complete one assessment to populate the dashboard.</p>
      ) : (
        <>
          <div className="analytics-grid">
            <StatCard
              title="Total Assessments Taken"
              insight="This is the full sample size for the dashboard."
            >
              <NumberStat value={total} label={total === 1 ? "assessment" : "assessments"} />
            </StatCard>

            <StatCard
              title="Average Overall Score"
              insight={scoreInsight(average_score, average_tier)}
            >
              <NumberStat
                value={average_score}
                label={`${average_tier} risk`}
                color={riskColor(average_score)}
              />
            </StatCard>

            <StatCard
              title="Score Trend Over Time"
              insight="Shows the average score by week."
            >
              {score_trend.length ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={score_trend} margin={{ top: 10, right: 14, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="avg_score"
                      name="Average score"
                      stroke="#4A7C59"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </StatCard>

            <StatCard
              title="Score Breakdown by Age Group"
              insight="Average score by profile age group."
            >
              {ageRows.length ? (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={ageRows} margin={{ top: 16, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Bar dataKey="score" name="Average score" radius={[4, 4, 0, 0]}>
                      {ageRows.map((row) => (
                        <Cell key={row.name} fill={riskColor(row.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </StatCard>

            <StatCard
              title="Score Breakdown by State"
              insight="Top 5 states by number of assessments."
            >
              {stateRows.length ? (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart layout="vertical" data={stateRows} margin={{ top: 8, right: 18, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis type="category" dataKey="name" width={42} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Bar dataKey="score" name="Average score" radius={[0, 4, 4, 0]} fill="#4A7C59">
                      <LabelList dataKey="count" position="right" formatter={(v) => `${v}`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </StatCard>

            <StatCard
              title="Score Breakdown by Employment Type"
              insight="Average score by work situation."
            >
              {employmentRows.length ? (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={employmentRows} margin={{ top: 16, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Bar dataKey="score" name="Average score" radius={[4, 4, 0, 0]}>
                      {employmentRows.map((row) => (
                        <Cell key={row.name} fill={riskColor(row.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </StatCard>

            <StatCard
              title="Emergency Resilience Breakdown"
              insight="How users answered the $900 expense question."
            >
              <ResponseBarChart data={emergencyRows} />
            </StatCard>

            <StatCard
              title="BNPL Usage Breakdown"
              insight="How many users picked each BNPL answer."
            >
              <ResponseBarChart data={bnplRows} />
            </StatCard>

            <StatCard
              title="Savings Behavior Breakdown"
              insight="How many users picked each savings answer."
            >
              <ResponseBarChart data={savingsRows} />
            </StatCard>
          </div>

          <section className="risk-summary-card">
            <div>
              <h3>Overall Risk Tier Distribution</h3>
              <p className="analytics-insight">Low, Medium, and High risk counts across all assessments.</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tierRows} margin={{ top: 18, right: 24, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip content={<SimpleTooltip />} />
                <Bar dataKey="count" name="Assessments" radius={[4, 4, 0, 0]}>
                  {tierRows.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                  <LabelList dataKey="count" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>
        </>
      )}
    </div>
  );
}

function ResponseBarChart({ data }) {
  const hasData = data.some((row) => row.count > 0);
  if (!hasData) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
        <Tooltip content={<SimpleTooltip />} />
        <Bar dataKey="count" name="Users" radius={[4, 4, 0, 0]}>
          {data.map((row, index) => (
            <Cell key={row.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
          <LabelList dataKey="count" position="top" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
