import React from "react";

export default function Landing({ onLogin, onRegister }) {
  return (
    <div className="landing">
      <div className="landing-hero">
        <p className="landing-stat">1 in 4 Americans cannot cover a $400 emergency.</p>
        <h1 className="landing-headline">Know where you stand, and what to do next.</h1>
        <p className="landing-body">
          The Financial Wellness Checker scores your financial vulnerability across four dimensions: banking
          access, emergency preparedness, spending behavior, and financial literacy.
          Scoring is grounded in SHED 2023, DCPC 2024, and CEX 2023 federal survey data,
          so every result reflects real national benchmarks.
        </p>
        <div className="landing-actions">
          <button className="btn-primary landing-btn" onClick={onRegister}>
            Get Started Free
          </button>
          <button className="btn-secondary landing-btn" onClick={onLogin}>
            Sign In
          </button>
        </div>
      </div>

      <div className="landing-pillars">
        {[
          { icon: "🏦", label: "Banking Access", desc: "SHED 2023 banking findings" },
          { icon: "🛡️", label: "Emergency Preparedness", desc: "SHED resilience data" },
          { icon: "💳", label: "Spending Behavior", desc: "DCPC & CEX 2024 data" },
          { icon: "📚", label: "Financial Literacy", desc: "SHED education findings" },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="pillar-card">
            <span className="pillar-icon">{icon}</span>
            <strong>{label}</strong>
            <span className="pillar-source">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
