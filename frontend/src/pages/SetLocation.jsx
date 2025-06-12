import { useState } from "react";
import axios from "axios";
import { debugLog } from "../utils/debug.js";

export default function SetLocation() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setStatus("Requesting location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const token = localStorage.getItem("token");

        try {
          const res = await axios.patch(
            `/api/users/update-location`,
            { lat, lon },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setStatus(`✅ Location set: ${res.data.location.coordinates.join(", ")}`);
          setError("");
          debugLog(res.data);
        } catch (err) {
          console.error("Update failed:", err);
          setError("Failed to update location.");
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Location access denied or failed.");
        setStatus("");
      }
    );
  };

  return (
    <div>
      <h2>Set Your Location</h2>
      <button onClick={handleUseMyLocation}>📍 Use My Current Location</button>

      {status && <p style={{ color: "green" }}>{status}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
