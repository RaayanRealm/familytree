import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/LoginPage.css";
import { FAMILY_API_URL } from "../services/api";

const LoginPage = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${FAMILY_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        window.dispatchEvent(new Event("userChanged"));
        navigate("/");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="login-bg-site">
      <div className="login-container-site">
        <h1 className="login-title-site">Sign in to Family Tree</h1>
        <form className="login-form-site" onSubmit={handleLogin}>
          <input
            className="login-input-site"
            type="text"
            placeholder="Username"
            autoFocus
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            className="login-input-site"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className="login-btn-site" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && <div className="login-error-site">{error}</div>}
          {successMsg && <div className="login-success-site">{successMsg}</div>}
        </form>
        <div className="login-footer-site">
          <button
            className="create-account-link"
            type="button"
            onClick={() => navigate("/create-account")}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
