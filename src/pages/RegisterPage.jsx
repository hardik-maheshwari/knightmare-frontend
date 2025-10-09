// In frontend/src/pages/RegisterPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthForm.css"; // We can reuse the same CSS
import { Link } from "react-router-dom";
import apiClient from "../services/apiClient";

function RegisterPage() {
  console.log("[RegisterPage] Component rendering.");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmission = async (e) => {
    e.preventDefault();

    if (isLoading) {
      console.warn(
        "[RegisterPage] Submission blocked because a request is already in progress."
      );
      return;
    }

    console.log("[RegisterPage] handleSubmission started.");
    setIsLoading(true);
    setError(null);

    try {
      console.log(
        `[RegisterPage] Sending registration request for user: ${username}`
      );

      const response = await apiClient.post("/api/auth/register/", {
        username,
        password,
      });

      console.log(
        "[RegisterPage] Registration request successful.",
        response.data
      );
      console.log("[RegisterPage] Navigating to /login.");

      navigate("/login");
    } catch (err) {
      console.error(
        "[RegisterPage] Registration request failed.",
        err.response || err
      );

      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      console.log(
        "[RegisterPage] handleSubmission finished. Setting isLoading to false."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmission}>
        <h2>Create Account</h2>
        {error && <p className="auth-error">{error}</p>}
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
          />
        </div>
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
          />
        </div>
        <button type="submit" className="auth-button" disabled={isLoading}>
          {/* 3. Update button text */}
          {isLoading ? "Creating Account..." : "Register"}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
