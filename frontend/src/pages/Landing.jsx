import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [offerSignup, setOfferSignup] = useState(false);

  const navigate = useNavigate();


  const handleSubmit = (e) => {
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
          navigate("/my-account")
        } else if (data.message === "User not found") {
          setOfferSignup(true); // Trigger signup prompt
          setStatus("⚠️ User not found. Do you want to sign up?");
        } else {
          setStatus("❌ Login failed: " + data.message);
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
        setStatus("❌ Something went wrong.");
      });
  };

  const handleSignup = () => {
    setStatus("⏳ Creating your account...");

    fetch("http://localhost:6969/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          setStatus("✅ Account created & logged in!");
          // Optionally redirect here
        } else {
          setStatus("❌ Signup failed: " + data.message);
        }
      })
      .catch((err) => {
        console.error("Signup error:", err);
        setStatus("❌ Something went wrong during signup.");
      });
  };
  return (
    <div style={{ textAlign: "center", marginTop: "5rem" }}>
      <h1>📚 Welcome to BookSwap 🍆</h1>
      <p>Find books. Swap books. Make connections.</p>
      <div>
        <h2>Login / Signup</h2>
        <form onSubmit={handleSubmit}>
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
          <button type="submit">Continue</button>
        </form>

        {offerSignup && (
          <div>
            <p>No account found for this email.</p>
            <button onClick={handleSignup}>Sign me up</button>
          </div>
        )}

        {status && <p>{status}</p>}
      </div>
    </div>
  );
}
