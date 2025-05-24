import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import countryList from "react-select-country-list";

import { useAuth } from "../contexts/AuthContext";
import { signup } from "../services/authService";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState(null);
  const [country, setCountry] = useState(null);
  const [status, setStatus] = useState("");
  

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const loadCityOptions = async (inputValue) => {
    if (!inputValue || !country?.value) return [];

    try {
      const res = await fetch(
        `https://secure.geonames.org/searchJSON?country=${country.value}&featureClass=P&maxRows=10&username=your_geonames_username&name_startsWith=${inputValue}`
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

  const handleSignup = async () => {
    setStatus("⏳ Creating your account...");

    try {
      const data = await signup({
        email,
        password,
        username,
        city: city?.value,
        country: country?.label,
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
         <Select
          options={countryList().getData()}
          value={country}
          onChange={(val) => setCountry(val)}
          placeholder="Select your country"
        />
        <br />
        <AsyncSelect
          placeholder="Start typing your city"
          loadOptions={loadCityOptions}
          value={city}
          onChange={(val) => setCity(val)}
          isDisabled={!country}
        />

        <button type="submit">Sign up</button>
      </form>
      {status && <p>{status}</p>}
    </>
  );
}
