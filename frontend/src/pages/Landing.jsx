import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import countryList from "react-select-country-list";
import { GiBookCover, GiBookmark } from "react-icons/gi";
import "./Landing.scss";

import { useAuth } from "../contexts/AuthContext";
import { login, signup } from "../services/authService";

export default function Landing() {
  const [showSignup, setShowSignup] = useState(false);
  const [status, setStatus] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState(null);
  const [country, setCountry] = useState(null);

  const GEO_USERNAME = import.meta.env.VITE_GEONAMES_USER;

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setStatus("⏳ Trying to log you in…");

    try {
      const { success, user, token, message, code } = await login(email, password); // <-- returns res.data

      if (success && user && token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        setStatus(`✅ ${message || "Logged in!"}`);
        navigate("/account");
        return;
      }

      // Backend responded 200 but login still failed (unlikely)
      setStatus("❌ " + (message || "Login failed."));
    } catch (err) {
      const { code, message } = err?.response?.data || {};

      if (code === "EMAIL_NOT_VERIFIED") {
        setStatus("❌ " + message); // clear, backend-driven
        return;
        // (Optional) show a "Resend verification" button here
      } else {
        setStatus("❌ " + (message || "Something went wrong. Please try again."));
      }
    }
  };

  const handleSignup = async () => {
    setStatus("⏳ Creating your account...");
    try {
      const data = await signup({
        email,
        password,
        username,
        city: city?.value,
        country: country?.value,
      });

      if (data.success && data.code === "REGISTER_SUCCESS" && data.user) {
        setStatus(
          "✅ Account created! Please check your email to verify your account before logging in."
        );
        setShowSignup(false);
      } else {
        setStatus("❌ Signup failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      const { code, message } = err?.response?.data || {};
      console.error("Signup error:", err);
      if (code === "EMAIL_TAKEN") {
        setStatus("⚠️ " + message);
        return;
      }
        setStatus("❌ " + (message || "Something went wrong during signup."));
    }
  };

  const loadCityOptions = async (inputValue) => {
    if (!inputValue || !country?.value) return [];
    try {
      const res = await fetch(
        `https://secure.geonames.org/searchJSON?country=${country.value}&featureClass=P&maxRows=10&username=${GEO_USERNAME}&name_startsWith=${inputValue}`
      );
      const data = await res.json();
      return data.geonames.map((place) => ({
        label: place.name,
        value: place.name,
      }));
    } catch (err) {
      console.error("GeoNames city lookup failed:", err);
      return [];
    }
  };

  return (
    <div className="landing-container">
      <div className="main-content">
        <div className="main-content-box">
          <h1>
            <GiBookCover /> Welcome to BookBook <GiBookmark />
          </h1>
          <p>Find books. Swap books. Make connections.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              showSignup ? handleSignup() : handleLogin();
            }}
          >
            {showSignup && (
              <>
                <input
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {showSignup && (
              <>
                <Select
                  options={countryList().getData()}
                  value={country}
                  onChange={(val) => setCountry(val)}
                  placeholder="Select your country"
                  classNamePrefix="react-select"
                />
                <AsyncSelect
                  placeholder="Start typing your city"
                  loadOptions={loadCityOptions}
                  value={city}
                  onChange={(val) => setCity(val)}
                  isDisabled={!country}
                  classNamePrefix="react-select"
                />
              </>
            )}
            <div className="landing-buttons">
              <button type="submit">{showSignup ? "Sign Up" : "Log In"}</button>
              <button type="button" onClick={() => setShowSignup(!showSignup)}>
                {showSignup ? "Back to Login" : "Sign Up"}
              </button>
            </div>
          </form>

          {status && <p>{status}</p>}
        </div>
      </div>
      <p className="info-section">
        Want to know more? <Link to="/about">About Us</Link> | <Link to="/careers">Careers</Link>
      </p>
      <img src="/720x1280-cG5n.png" alt="stack of books" className="corner-image" />
    </div>
  );
}
