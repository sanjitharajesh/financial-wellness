import React, { useState } from "react";
import { register as apiRegister } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Register({ onSuccess, onLogin }) {
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
      const { data } = await apiRegister(username, password);
      login(data.access, data.username);
      onSuccess();
    } catch (err) {
      const data = err.response?.data;
      if (data?.username) setError(data.username[0]);
      else if (data?.password) setError(data.password[0]);
      else setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">Create your account</h2>
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
          <span className="auth-hint">(minimum 8 characters)</span>
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn-primary auth-submit" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account?{" "}
        <button className="link-btn" onClick={onLogin}>
          Sign in
        </button>
      </p>
    </div>
  );
}
