import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { debugLog } from "../utils/debug.js";
import axios from "axios";
import "./MapComponent.scss";

export const redIcon = new L.Icon({
  iconUrl: "/markers/marker-icon-2x-red.png",
  shadowUrl: "/markers/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "red-pin",
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

export default function MapComponent({
  forceReload,
  editLocation,
  setEditLocation,
  refreshUserInfo,
}) {
  const [mapCenter, setMapCenter] = useState([12.891404295324467, 100.87394532173053]);
  const [zoom, setZoom] = useState(4);
  const [users, setUsers] = useState([]);
  const [tempPosition, setTempPosition] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const filteredUsers = searchTerm
    ? users.filter((user) =>
        user.books.some(
          (book) =>
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : users;

  useEffect(() => {
    const fetchMapUsers = async () => {
      try {
        const res = await axios.get("/api/map/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        debugLog("Map Users Fetched:", res.data);
        setUsers(res.data);

        const currentUser = res.data.find((u) => u.isCurrentUser);
        if (currentUser) {
          const [lon, lat] = currentUser.location.coordinates;
          setMapCenter([lat, lon]);
          setZoom(10);
        }
      } catch (err) {
        console.error("Failed to fetch map users", err);
      }
    };

    fetchMapUsers();
  }, [forceReload]);

  const handleSaveLocation = async ([lat, lng]) => {
    try {
      await axios.patch(
        "/api/users/update-location",
        { lat, lon: lng },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMapCenter([lat, lng]);
      setTempPosition(null);
      setEditLocation(false);
      refreshUserInfo?.();
      debugLog(" Location updated successfully");
    } catch (err) {
      console.error("Failed to update location", err);
    }
  };

  const handleStartEdit = () => {
    setEditLocation(true);
  };

  const handleCancelEdit = () => {
    setEditLocation(false);
    setTempPosition(null);
  };

  return (
    <div className="map-wrapper">
      <MapContainer
        className="map-container"
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <RecenterMap center={mapCenter} zoom={zoom} />
        <Marker
          icon={redIcon}
          position={tempPosition || mapCenter}
          draggable={editLocation}
          eventHandlers={
            editLocation
              ? {
                  dragend: (e) => {
                    const marker = e.target;
                    const newPos = marker.getLatLng();
                    setTempPosition([newPos.lat, newPos.lng]);
                  },
                }
              : {}
          }
        />
        {filteredUsers.map((user) => {
          const [lon, lat] = user.location.coordinates;

          if (user.isCurrentUser) return null;

          return (
            <Marker key={user._id} position={[lat, lon]} icon={blueIcon}>
              <Popup>
                <div className="preview-popup">
                  <div className="leaflet-username">{user.username}</div>
                  <div className="book-preview">
                    {user.books.slice(0, 5).map((book, idx) => (
                      <div key={idx}>{book.title}</div>
                    ))}
                    {user.books.length > 5 && <span className="and-more">...and more</span>}
                  </div>
                  <button
                    className="preview-popup-button"
                    onClick={() => navigate(`/swap/${user._id}`)}
                  >
                    🔄 View All Books
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className="custom-attribution">
        © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>
      </div>

      <input
        className="map-search-bar"
        type="text"
        placeholder="🔍 Search by book title or author..."
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {!editLocation && (
        <button className="edit-location-btn" onClick={handleStartEdit}>
          📍 Edit Location
        </button>
      )}

      {editLocation &&
        (tempPosition ? (
          <button className="save-location-btn" onClick={() => handleSaveLocation(tempPosition)}>
            ✅ Save Location
          </button>
        ) : (
          <button className="cancel-location-btn" onClick={handleCancelEdit}>
            ❌ Cancel
          </button>
        ))}
    </div>
  );
}
