import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import "./Map.scss";

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

export default function MapComponent() {
  const [mapCenter, setMapCenter] = useState([51.1657, 10.4515]); // 🇩🇪 fallback
  const [zoom, setZoom] = useState(4);

  useEffect(() => {
    const fetchMyLocation = async () => {
      try {
        const res = await axios.get("/api/map/me/location", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const { latitude, longitude } = res.data;
        setMapCenter([latitude, longitude]);
        setZoom(10);
      } catch (err) {
        console.error("Failed to fetch your location", err);
      }
    };

    fetchMyLocation();
  }, []);

  return (
    <MapContainer
      className="map-container"
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={mapCenter} zoom={zoom} />
    </MapContainer>
  );
}