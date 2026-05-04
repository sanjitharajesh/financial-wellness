import React, { useState } from "react";
import { login as apiLogin } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login({ onSuccess, onRegister }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiLogin(username, password);
      login(data.access, username);
      onSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">Sign in to your account</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label className="auth-label">
          Username
          <input
            className="auth-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="auth-label">
          Password
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn-primary auth-submit" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <p className="auth-switch">
        Don&apos;t have an account?{" "}
        <button className="link-btn" onClick={onRegister}>
          Create one
        </button>
      </p>
    </div>
  );
}
