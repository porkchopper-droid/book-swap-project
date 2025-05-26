import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import "./MapComponent.scss";

export const redIcon = new L.Icon({
  iconUrl: "/markers/marker-icon-2x-red.png",
  shadowUrl: "/markers/marker-shadow.png",
  iconSize: [25, 41], // same as default Leaflet
  iconAnchor: [12, 41], // tip of the pin
  popupAnchor: [1, -34], // position where popup opens
  shadowSize: [41, 41], // match the shadow
});

export const blueIcon = new L.Icon({
  iconUrl: "/markers/marker-icon-2x-blue.png",
  shadowUrl: "/markers/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

export default function MapComponent({ forceReload }) {
  const [mapCenter, setMapCenter] = useState([51.1657, 10.4515]); // 🇩🇪 fallback
  const [zoom, setZoom] = useState(4);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchMapUsers = async () => {
      try {
        const res = await axios.get("/api/map/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        setUsers(res.data);

        const me = res.data.find((u) => u.isCurrentUser);
        if (me) {
          const [lon, lat] = me.location.coordinates;
          setMapCenter([lat, lon]);
          setZoom(10);
        }
      } catch (err) {
        console.error("Failed to fetch map users", err);
      }
    };

    fetchMapUsers();
  }, [forceReload]);

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
  }, [forceReload]);

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
      <Marker icon={redIcon} position={mapCenter} draggable={false}>
      </Marker>
      {users.map((user) => {
        const [lon, lat] = user.location.coordinates;

        // Skip rendering your own pin (already done with redIcon)
        if (user.isCurrentUser) return null;

        return (
          <Marker key={user._id} position={[lat, lon]} icon={blueIcon}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
              {user.username}
            </Tooltip>

            <Popup>
              <div>
                <strong>{user.username}</strong>
                <div className="book-preview">
                  {user.books.slice(0, 5).map((book, idx) => (
                    <div key={idx}>{book.title}</div>
                  ))}
                  {user.books.length > 5 && <em>...and more</em>}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
