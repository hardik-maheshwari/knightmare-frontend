import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Changed <a> to <Link>
import "./AuthForm.css";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../services/apiClient";

function LoginPage() {
  console.log("[LoginPage] Component rendering.");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log(
      "[LoginPage] Navigation effect is running. isAuthenticated:",
      isAuthenticated
    );
    if (isAuthenticated) {
      console.log("[LoginPage] User is authenticated, navigating to /lobby.");
      navigate("/lobby", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmission = async (e) => {
    e.preventDefault();

    if (isLoading) {
      console.warn(
        "[LoginPage] Submission blocked because a request is already in progress."
      );
      return;
    }

    console.log("[LoginPage] handleSubmission started.");
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[LoginPage] Sending login request for user: ${username}`);
      const response = await apiClient.post("/api/auth/login/", {
        username,
        password,
      });

      const { data: loginData } = response.data;
      console.log(
        "[LoginPage] Login request successful. Calling login() from AuthContext."
      );
      console.debug("[LoginPage] Received token:", loginData.token);

      login(loginData.token);
    } catch (err) {
      console.error("[LoginPage] Login request failed.", err.response || err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      console.log(
        "[LoginPage] handleSubmission finished. Setting isLoading to false."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmission}>
        <h2>Login</h2>
        {error && <p className="auth-error">{error}</p>}

        {/* --- USERNAME INPUT --- */}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="username" // Good for user experience
          />
        </div>

        {/* --- PASSWORD INPUT --- */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="current-password" // Good for user experience
          />
        </div>

        <button type="submit" className="auth-button" disabled={isLoading}>
          {isLoading ? "Logging In..." : "Log In"}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
