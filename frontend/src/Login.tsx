import { useState } from "react";

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });
      if (!res.ok) {
        setError("Forkert email eller adgangskode");
        return;
      }
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      onLogin();
    } catch {
      setError("Kunne ikke forbinde til server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
      }}
    >
      <div
        style={{
          backgroundColor: "#1e293b",
          padding: "40px",
          borderRadius: "12px",
          width: "360px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <h2 style={{ color: "white", marginBottom: "24px", textAlign: "center" }}>
          Ejendomsoversigt
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#0f172a",
              color: "white",
              fontSize: "14px",
            }}
          />
          <input
            type="password"
            placeholder="Adgangskode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #334155",
              backgroundColor: "#0f172a",
              color: "white",
              fontSize: "14px",
            }}
          />

          {error && (
            <p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              padding: "10px",
              backgroundColor: "#1e3a8a",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              marginTop: "4px",
            }}
          >
            {loading ? "Logger ind..." : "Log ind"}
          </button>
        </div>
      </div>
    </div>
  );
}
