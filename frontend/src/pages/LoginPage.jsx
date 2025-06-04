import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/LoginPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LoginPage = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [role, setRole] = useState("viewer");
  const [memberId, setMemberId] = useState("");
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
      const res = await fetch(`${API_BASE_URL}/api/family/login`, {
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

  const handleCreate = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          role,
          member_id: memberId ? Number(memberId) : null
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setSuccessMsg("Account created! You can now sign in.");
        setShowCreate(false);
        setUsername("");
        setPassword("");
        setRole("viewer");
        setMemberId("");
      } else {
        setError(data.error || "Account creation failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="login-bg-site">
      <div className="login-container-site">
        <h1 className="login-title-site">{showCreate ? "Create Account" : "Sign in to Family Tree"}</h1>
        <form className="login-form-site" onSubmit={showCreate ? handleCreate : handleLogin}>
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
          {showCreate && (
            <>
              <select
                className="login-input-site"
                value={role}
                onChange={e => setRole(e.target.value)}
                required
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="guest">Guest</option>
                {/* Admin creation should be restricted in production */}
              </select>
              <input
                className="login-input-site"
                type="number"
                placeholder="Member ID (for lineage access)"
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
                min={1}
              />
            </>
          )}
          <button className="login-btn-site" type="submit" disabled={loading}>
            {loading ? (showCreate ? "Creating..." : "Logging in...") : showCreate ? "Create Account" : "Login"}
          </button>
          {error && <div className="login-error-site">{error}</div>}
          {successMsg && <div className="login-success-site">{successMsg}</div>}
        </form>
        <div className="login-footer-site">
          {!showCreate ? (
            <button className="create-account-link" onClick={() => { setShowCreate(true); setError(""); setSuccessMsg(""); }}>
              Create Account
            </button>
          ) : (
            <button className="create-account-link" onClick={() => { setShowCreate(false); setError(""); setSuccessMsg(""); }}>
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
