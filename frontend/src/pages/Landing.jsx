import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { login } from "../services/authService";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const { setUser } = useAuth();

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus("⏳ Trying to log you in...");

    try {
      const data = await login(email, password);

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setStatus("✅ Logged in!");
        navigate("/my-account");
      } else {
        setStatus(
          "❌ Login failed: " + (data.message || "Invalid credentials")
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setStatus("❌ Something went wrong.");
    }
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
