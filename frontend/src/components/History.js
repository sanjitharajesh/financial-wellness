import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { fetchHistory, fetchActionItems } from "../api";
import { RECOMMENDATIONS } from "../recommendationData";

const TIER_COLORS = { Low: "#4A7C59", Medium: "#C9A84C", High: "#8B3A3A" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [doneItems, setDoneItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchHistory(), fetchActionItems()])
      .then(([histRes, actionRes]) => {
        setHistory(histRes.data);
        setDoneItems(actionRes.data);
      })
      .catch(() => setError("Could not load history."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="stats-card"><p>Loading history…</p></div>;
  if (error) return <div className="stats-card"><p className="error-msg">{error}</p></div>;

  if (history.length === 0) {
    return (
      <div className="stats-card">
        <h2>Score History</h2>
        <p className="no-data">No assessments yet. Complete your first one to start tracking progress.</p>
      </div>
    );
  }

  const chartData = history.map((a) => ({
    date: formatDate(a.created_at),
    Score: a.score,
    tier: a.risk_tier,
  }));

  const latest = history[history.length - 1];

  return (
    <div className="stats-card">
      <h2>Score History</h2>
      <p className="stats-sub">
        {history.length} assessment{history.length !== 1 ? "s" : ""} | Latest:{" "}
        <strong style={{ color: TIER_COLORS[latest.risk_tier] }}>
          {latest.score} ({latest.risk_tier} Risk)
        </strong>
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 240]} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v, _, props) => [
              `${v} (${props.payload.tier} Risk)`,
              "Score",
            ]}
          />
          <ReferenceLine y={40} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Low cap", position: "right", fontSize: 11 }} />
          <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Medium cap", position: "right", fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="Score"
            stroke="#1e3a5f"
            strokeWidth={2.5}
            dot={{ r: 5, fill: "#1e3a5f" }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <table className="breakdown-table" style={{ marginTop: "1.5rem" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Score</th>
            <th>Tier</th>
            <th>Banking</th>
            <th>Emergency</th>
            <th>Spending</th>
            <th>Literacy</th>
          </tr>
        </thead>
        <tbody>
          {[...history].reverse().map((a) => (
            <tr key={a.id}>
              <td>{formatDate(a.created_at)}</td>
              <td><strong>{a.score}</strong></td>
              <td style={{ color: TIER_COLORS[a.risk_tier], fontWeight: 600 }}>{a.risk_tier}</td>
              <td>{a.banking_score}</td>
              <td>{a.emergency_score}</td>
              <td>{a.spending_score}</td>
              <td>{a.literacy_score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(() => {
        const completed = Object.entries(doneItems)
          .filter(([, done]) => done)
          .map(([key]) => ({ key, title: RECOMMENDATIONS[key]?.title || key }));
        if (completed.length === 0) return null;
        return (
          <div className="completed-actions-section">
            <h3>Completed Action Items ({completed.length})</h3>
            {completed.map(({ key, title }) => (
              <div key={key} className="completed-action-row">
                <span className="completed-check">✓</span>
                <span>{title}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
