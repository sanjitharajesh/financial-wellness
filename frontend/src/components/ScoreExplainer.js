import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";

const DATA_SOURCES = [
  {
    name: "SHED 2023",
    full: "Survey of Household Economics and Decisionmaking",
    year: "2023",
    sample: "11,400 U.S. adults",
    contribution:
      "Banking access, emergency resilience, savings behavior, and financial stress weights, the primary dataset driving emergency and banking section scoring.",
  },
  {
    name: "DCPC 2024",
    full: "Diary of Consumer Payment Choice",
    year: "2024",
    sample: "28,515 transactions, 3,500 consumers",
    contribution:
      "Payment behavior and spending pattern weights, transaction-level data used to calibrate spending behavior section scoring.",
  },
  {
    name: "CEX 2023",
    full: "Consumer Expenditure Survey",
    year: "Q2 2023 - Q1 2024",
    sample: "Approx. 30,000 households",
    contribution:
      "Household spending category benchmarks, essential vs. discretionary spending shares used to calibrate cash flow question scoring.",
  },
];

const KEY_FINDINGS = [
  {
    finding: "Banked individuals are 13.24x more likely to handle a $400 emergency",
    dataset: "SHED 2023",
    test: "Chi-square p<0.001",
    appMeaning: "Emergency resilience section weighted heavily toward banking access answers",
  },
  {
    finding: "24 percentage point savings gap between those with and without emergency funds",
    dataset: "SHED 2023",
    test: "Chi-square p<0.001",
    appMeaning: "Emergency buffer question carries high point penalty for 'haven't thought about it' responses",
  },
  {
    finding: "BNPL users show 35.5% vs 60% emergency fund rates",
    dataset: "SHED 2023",
    test: "Chi-square p<0.001",
    appMeaning: "BNPL question carries a high point penalty, regular BNPL use is treated as a structural risk signal",
  },
  {
    finding: "Digital payments produce 130.7% higher median transaction amounts",
    dataset: "DCPC 2024",
    test: "Mann-Whitney U p<0.001",
    appMeaning: "Payment behavior section context, spending pattern data informs credit and BNPL question framing",
  },
  {
    finding: "Banking access benefits are strongest for lower-education households",
    dataset: "SHED 2023",
    test: "Chi-square p<0.001",
    appMeaning: "Financial literacy section weighting, literacy and awareness questions are treated as compound risk amplifiers",
  },
  {
    finding: "Essential spending categories account for 92% of household expenditure",
    dataset: "CEX 2023",
    test: "Descriptive analysis",
    appMeaning: "Cash flow question benchmarks, scoring reflects how little room most households have for irregular expenses",
  },
];

const SCORING_WEIGHTS = [
  { question: "Monthly Cash Flow", section: "Banking Access", maxPts: 30, dataset: "CEX 2023" },
  { question: "Income Stability", section: "Emergency Preparedness", maxPts: 20, dataset: "SHED 2023" },
  { question: "$900 Emergency Response", section: "Emergency Preparedness", maxPts: 30, dataset: "SHED 2023" },
  { question: "Emergency Buffer Size", section: "Emergency Preparedness", maxPts: 30, dataset: "SHED 2023" },
  { question: "Debt Situation", section: "Emergency Preparedness", maxPts: 25, dataset: "SHED 2023" },
  { question: "BNPL Usage", section: "Spending Behavior", maxPts: 25, dataset: "SHED 2023" },
  { question: "Credit Card Behavior", section: "Spending Behavior", maxPts: 20, dataset: "DCPC 2024" },
  { question: "Money Awareness", section: "Financial Literacy", maxPts: 25, dataset: "SHED 2023" },
  { question: "Savings Behavior", section: "Financial Literacy", maxPts: 25, dataset: "SHED 2023" },
];

const SECTION_COLORS = {
  "Banking Access": "#4A7C59",
  "Emergency Preparedness": "#8B3A3A",
  "Spending Behavior": "#C9A84C",
  "Financial Literacy": "#3A7AB8",
};

const TIER_CARDS = [
  {
    tier: "Low",
    range: "0 - 50 points",
    color: "#4A7C59",
    bg: "#EEF4F0",
    border: "#A8C8B0",
    description:
      "Your financial fundamentals are largely in order. You have reasonable cash flow stability, some emergency resilience, and manageable spending behavior. The risks that exist are specific and addressable rather than structural. At this tier, the goal is incremental strengthening, building emergency buffers, automating savings, and reducing any remaining high-cost debt, rather than crisis intervention.",
    nextStep:
      "Focus on converting any manual savings habits to automated ones, and work toward a 3-month emergency buffer if you don't already have one.",
  },
  {
    tier: "Medium",
    range: "51 - 95 points",
    color: "#7A5C1A",
    bg: "#FBF7EC",
    border: "#E8D4A0",
    description:
      "You are managing financially, but carrying meaningful risk in specific areas that can compound if left unaddressed. Medium risk often means some structural gaps, a thin emergency buffer, variable income without a volatility reserve, or revolving credit balances, that feel manageable today but create vulnerability during disruptions. The difference between Medium and High risk is often timing: the same gaps that feel stable in a steady month become crises during an unexpected one.",
    nextStep:
      "Prioritize the highest-risk section identified in your assessment, and address at least two action items before your next assessment.",
  },
  {
    tier: "High",
    range: "96+ points",
    color: "#8B3A3A",
    bg: "#F7EEEE",
    border: "#D4A0A0",
    description:
      "Your assessment indicates significant financial vulnerability across multiple dimensions. This tier does not mean failure, it means the structural conditions that make financial shocks hard to absorb are currently stacked against you. High risk frequently correlates with compounding factors: thin cash flow and no emergency buffer and revolving debt and irregular income simultaneously. None of these are permanent conditions, but they require deliberate, sequenced action rather than general improvement.",
    nextStep:
      "Start with the single highest-impact item in your action plan and execute it fully before moving to the next. Momentum from one completed action is worth more than partial progress on many.",
  },
];

function WeightsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="stats-tooltip">
      <p className="stats-tooltip-title">{label}</p>
      <p className="stats-tooltip-row">
        <span>Max contribution: </span>
        <span className="stats-tooltip-pct">{row.maxPts} pts</span>
      </p>
      <p className="stats-tooltip-row">
        <span>Section: </span>
        <span>{row.section}</span>
      </p>
      <p className="stats-tooltip-row">
        <span>Dataset: </span>
        <span>{row.dataset}</span>
      </p>
    </div>
  );
}

export default function ScoreExplainer() {
  return (
    <div className="explainer-card">
      <div className="explainer-header">
        <h2 className="explainer-title">How Your Score Is Calculated</h2>
        <p className="explainer-subtitle">
          This tool is not a generic quiz. Every scoring weight is derived from statistically validated federal survey data.
        </p>
      </div>

      {/* Section 1: Data Sources */}
      <div className="explainer-section">
        <h3 className="explainer-section-title">The Data Sources</h3>
        <div className="data-sources-grid">
          {DATA_SOURCES.map((ds) => (
            <div key={ds.name} className="data-source-card">
              <div className="data-source-name">{ds.name}</div>
              <div className="data-source-full">{ds.full}</div>
              <div className="data-source-meta">
                <span>{ds.year}</span>
                <span className="data-source-sep">·</span>
                <span>{ds.sample}</span>
              </div>
              <p className="data-source-contribution">{ds.contribution}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Key Findings */}
      <div className="explainer-section">
        <h3 className="explainer-section-title">Key Findings That Power the Score</h3>
        <div className="findings-table-wrapper">
          <table className="findings-table">
            <thead>
              <tr>
                <th>Finding</th>
                <th>Dataset</th>
                <th>Statistical Test</th>
                <th>What It Means in the App</th>
              </tr>
            </thead>
            <tbody>
              {KEY_FINDINGS.map((row, i) => (
                <tr key={i}>
                  <td>{row.finding}</td>
                  <td className="findings-dataset">{row.dataset}</td>
                  <td className="findings-test">{row.test}</td>
                  <td>{row.appMeaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Scoring Weights */}
      <div className="explainer-section">
        <h3 className="explainer-section-title">Scoring Weights</h3>
        <p className="explainer-chart-note">
          Bar length represents the maximum points each question can contribute to your total risk score. Higher max contribution = that question carries more weight in the final result.
        </p>
        <div className="explainer-section-legend">
          {Object.entries(SECTION_COLORS).map(([section, color]) => (
            <div key={section} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              <span>{section}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            layout="vertical"
            data={SCORING_WEIGHTS}
            margin={{ top: 8, right: 60, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 35]}
              tickFormatter={(v) => `${v} pts`}
              tick={{ fontFamily: "Inter, sans-serif", fontSize: 11, fill: "#8A8A8A" }}
            />
            <YAxis
              type="category"
              dataKey="question"
              width={175}
              tick={{ fontFamily: "Inter, sans-serif", fontSize: 11, fill: "#3A3A3A" }}
            />
            <Tooltip content={<WeightsTooltip />} />
            <Bar dataKey="maxPts" radius={[0, 4, 4, 0]}>
              {SCORING_WEIGHTS.map((entry) => (
                <Cell key={entry.question} fill={SECTION_COLORS[entry.section] || "#4A7C59"} />
              ))}
              <LabelList
                dataKey="maxPts"
                position="right"
                style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, fill: "#1A1A1A" }}
                formatter={(v) => `${v} pts`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section 4: Tier Descriptions */}
      <div className="explainer-section">
        <h3 className="explainer-section-title">What Your Score Means</h3>
        <div className="tier-cards-row">
          {TIER_CARDS.map((t) => (
            <div
              key={t.tier}
              className="tier-explainer-card"
              style={{ background: t.bg, borderColor: t.border }}
            >
              <div className="tier-explainer-badge" style={{ background: t.color }}>
                {t.tier} Risk
              </div>
              <div className="tier-explainer-range">{t.range}</div>
              <p className="tier-explainer-desc">{t.description}</p>
              <p className="tier-explainer-next">
                <strong>Most important next step:</strong> {t.nextStep}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="explainer-footer-note">
        This tool is for educational purposes only and does not constitute financial advice. Scoring methodology developed from publicly available federal survey microdata.
      </p>
    </div>
  );
}
