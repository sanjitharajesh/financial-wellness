import React from "react";

const SECTIONS = [
  {
    icon: "🏦",
    title: "Banking Access",
    desc: "What is usually left after essentials are covered.",
  },
  {
    icon: "🛡️",
    title: "Emergency Preparedness",
    desc: "How you'd handle a sudden rent increase or unexpected expense.",
  },
  {
    icon: "💳",
    title: "Spending Behavior",
    desc: "Your payment habits and use of credit or Buy Now Pay Later.",
  },
  {
    icon: "📚",
    title: "Financial Literacy",
    desc: "How often you check in on money and save on purpose.",
  },
];

export default function Onboarding({ onStart, onOpenProfile, profile }) {
  const bannerIncomplete = !!(profile && profile.incomplete);

  return (
    <div className="onboarding-card">
      {bannerIncomplete && onOpenProfile && (
        <div className="dashboard-alert profile-incomplete-banner" role="status">
          <div>
            <strong>Finish your profile</strong>
            <p>
              Completing employment, dependents, and state helps us tailor your question path and recommendations.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onOpenProfile}>
            Complete profile
          </button>
        </div>
      )}

      <h1 className="onboarding-title">Your Financial Wellness Assessment</h1>
      <div className="onboarding-sections">
        {SECTIONS.map(({ icon, title, desc }) => (
          <div key={title} className="onboarding-section-row">
            <span className="onboarding-icon">{icon}</span>
            <div>
              <strong>{title}</strong>
              <p className="onboarding-section-desc">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary onboarding-btn" onClick={onStart}>
        Start Assessment
      </button>
    </div>
  );
}
