import { useState } from "react";

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
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const token = localStorage.getItem("token"); // retrieve auth token

        fetch("http://localhost:6969/api/users/update-location", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ lat, lon }),
        })
          .then((res) => res.json())
          .then((data) => {
            setStatus(
              `✅ Location set: ${data.location.coordinates.join(", ")}`
            );
            setError("");
            console.log(data);
          })
          .catch((err) => {
            console.error("Update failed:", err);
            setError("Failed to update location.");
          });
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
