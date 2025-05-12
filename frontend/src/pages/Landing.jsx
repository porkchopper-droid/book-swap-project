import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setStatus("⏳ Trying to log you in...");

    fetch("http://localhost:6969/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          setStatus("✅ Logged in!");
          navigate("/my-account");
        } else {
          setStatus("❌ Login failed: " + data.message);
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
        setStatus("❌ Something went wrong.");
      });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "5rem" }}>
      <h1>📚 Welcome to BookSwap 🍆</h1>
      <p>Find books. Swap books. Make connections.</p>
      <div>
        <h2>🐔🐔🐔</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />

          <button type="submit" onClick={handleLogin}>
            Log In
          </button>
          <button type="button" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </form>

        {status && <p>{status}</p>}
      </div>
    </div>
  );
}
