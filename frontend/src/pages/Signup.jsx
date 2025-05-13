import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { signup } from "../services/authService";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSignup = async () => {
    setStatus("⏳ Creating your account...");

    try {
      const data = await signup({
        email,
        password,
        username,
        city,
        country,
        location: { type: "Point", coordinates: [0, 0] },
      });

      console.log("Signup response:", data);

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setStatus("✅ Account created & logged in!");
        navigate("/my-account");
      } else {
        setStatus("❌ Signup failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Signup error:", err);
      setStatus("❌ Something went wrong during signup.");
    }
  };

  return (
    <>
      <h2>Sign-up page</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSignup();
        }}
      >
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <br />
        <input
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <br />
        <br />

        <button type="submit">Sign up</button>
      </form>
      {status && <p>{status}</p>}
    </>
  );
}
