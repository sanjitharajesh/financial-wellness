import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { fetchProfile } from "./api";

import Landing from "./components/Landing";
import Login from "./components/Login";
import Register from "./components/Register";
import Onboarding from "./components/Onboarding";
import AssessmentForm from "./components/AssessmentForm";
import Results from "./components/Results";
import ActionPlan from "./components/ActionPlan";
import History from "./components/History";
import Stats from "./components/Stats";
import Profile from "./components/Profile";
import ScoreExplainer from "./components/ScoreExplainer";

const APP_NAME = "The Financial Wellness Checker";

export default function App() {
  const { isAuthenticated, username, logout } = useAuth();
  const [page, setPage] = useState("landing");
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState(null);
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    fetchProfile()
      .then(({ data }) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile({ incomplete: true });
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleAuthSuccess = () => setPage("onboarding");

  const handleProfileSaved = (data) => {
    setProfile(data);
  };

  const handleStartAssessment = () => {
    setResult(null);
    setAnswers(null);
    setPage("form");
  };

  const handleComplete = (data, submittedAnswers) => {
    setResult(data);
    setAnswers(submittedAnswers);
    setPage("results");
  };

  const handleResultFetched = (fetchedResult, fetchedAnswers) => {
    setResult(fetchedResult);
    setAnswers(fetchedAnswers);
  };

  const handleLogout = () => {
    logout();
    setPage("landing");
    setResult(null);
    setAnswers(null);
    setProfile(null);
  };

  const goHome = () => setPage(isAuthenticated ? "onboarding" : "landing");

  if (!isAuthenticated) {
    return (
      <div className="app-wrapper">
        <header className="app-header">
          <div className="header-inner">
            <span className="logo" onClick={() => setPage("landing")} style={{ cursor: "pointer" }}>
              {APP_NAME}
            </span>
            <nav className="header-nav">
              <button type="button" className="nav-btn" onClick={() => setPage("login")}>
                Sign In
              </button>
              <button type="button" className="nav-btn" onClick={() => setPage("register")}>
                Register
              </button>
            </nav>
          </div>
        </header>
        <main className="main-content">
          {page === "landing" && (
            <Landing
              onLogin={() => setPage("login")}
              onRegister={() => setPage("register")}
            />
          )}
          {page === "login" && (
            <Login
              onSuccess={handleAuthSuccess}
              onRegister={() => setPage("register")}
            />
          )}
          {page === "register" && (
            <Register
              onSuccess={handleAuthSuccess}
              onLogin={() => setPage("login")}
            />
          )}
        </main>
      </div>
    );
  }

  const activeNav = (p) =>
    (p === "assessment" && ["onboarding", "form"].includes(page)) ||
    (p === "results" && ["results", "action"].includes(page)) ||
    page === p;

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-inner">
          <span className="logo" onClick={goHome} style={{ cursor: "pointer" }}>
            {APP_NAME}
          </span>
          <nav className="header-nav">
            <button
              type="button"
              className={`nav-btn${activeNav("assessment") ? " active" : ""}`}
              onClick={() => setPage("onboarding")}
            >
              Assessment
            </button>
            <button
              type="button"
              className={`nav-btn${activeNav("profile") ? " active" : ""}`}
              onClick={() => setPage("profile")}
            >
              Profile
            </button>
            <button
              type="button"
              className={`nav-btn${activeNav("results") ? " active" : ""}`}
              onClick={() => setPage("results")}
            >
              Results
            </button>
            <button
              type="button"
              className={`nav-btn${activeNav("history") ? " active" : ""}`}
              onClick={() => setPage("history")}
            >
              History
            </button>
            <button
              type="button"
              className={`nav-btn${activeNav("stats") ? " active" : ""}`}
              onClick={() => setPage("stats")}
            >
              Stats
            </button>
            <button
              type="button"
              className={`nav-btn${activeNav("explainer") ? " active" : ""}`}
              onClick={() => setPage("explainer")}
            >
              How This Works
            </button>
          </nav>
          <div className="header-user">
            <span className="header-username">{username}</span>
            <button type="button" className="nav-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className={["results", "action", "stats", "explainer"].includes(page) ? "main-content-wide" : "main-content"}>
        {page === "onboarding" && (
          <Onboarding
            profile={profile}
            onStart={handleStartAssessment}
            onOpenProfile={() => setPage("profile")}
          />
        )}
        {page === "form" && <AssessmentForm profile={profile} onComplete={handleComplete} />}
        {page === "results" && (
          <Results
            result={result}
            answers={answers}
            profile={profile}
            onResultFetched={handleResultFetched}
            onRestart={handleStartAssessment}
            onActionPlan={() => setPage("action")}
          />
        )}
        {page === "action" && (
          <ActionPlan
            result={result}
            answers={answers}
            profile={profile}
            onBack={() => setPage("results")}
          />
        )}
        {page === "profile" && <Profile onProfileSaved={handleProfileSaved} />}
        {page === "history" && <History />}
        {page === "stats" && <Stats />}
        {page === "explainer" && <ScoreExplainer />}
      </main>
    </div>
  );
}
