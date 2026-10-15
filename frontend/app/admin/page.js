"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("reachforeverAdminToken");
    if (token) router.replace("/admin/dashboard");
  }, [router]);

  async function login(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed. Check your credentials.");
      }

      const token = data.token || data.accessToken;
      if (!token) {
        throw new Error("The server did not return an authentication token.");
      }

      localStorage.setItem("reachforeverAdminToken", token);
      setPassword("");
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Unable to log in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <form className="admin-login-card" onSubmit={login}>
        <Link className="admin-back-link" href="/">
          ← ReachForever website
        </Link>

        <div className="admin-login-brand">
          <span className="admin-login-mark">RF</span>
          <span>ReachForever</span>
        </div>

        <p className="admin-eyebrow">ADMINISTRATION</p>
        <h1>Welcome back.</h1>
        <p className="admin-login-description">
          Sign in to manage your website, portfolio and content.
        </p>

        {error && (
          <p className="admin-error-message" role="alert">{error}</p>
        )}

        <label className="admin-field">
          <span>Username</span>
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="admin-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button className="admin-primary-button" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in to dashboard"}
        </button>

        <p className="admin-login-footnote">
          Restricted access · Authorized administrators only
        </p>
      </form>
    </main>
  );
}
