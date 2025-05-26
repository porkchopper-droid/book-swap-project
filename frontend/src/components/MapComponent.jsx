import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
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
  const [mapCenter, setMapCenter] = useState([
    12.891404295324467, 100.87394532173053,
  ]);
  const [zoom, setZoom] = useState(4);
  const [users, setUsers] = useState([]);
  const [tempPosition, setTempPosition] = useState(null);

  useEffect(() => {
    const fetchMapUsers = async () => {
      try {
        const res = await axios.get("/api/map/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        console.log("Map Users Fetched:", res.data);
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
      await refreshUserInfo?.();
      console.log("Location updated successfully");
    } catch (err) {
      console.error(" Failed to update location", err);
    }
  };

  return (
    <div className="map-wrapper">
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
        {users.map((user) => {
          const [lon, lat] = user.location.coordinates;

          if (user.isCurrentUser) return null;

          console.log(user.username, lat, lon); // 👈 ADD THIS

          return (
            <Marker key={user._id} position={[lat, lon]} icon={blueIcon}>
              <Popup>
                <div>
                  <div className="leaflet-username">{user.username}</div>
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

      {editLocation && tempPosition && (
        <button
          className="save-location-btn"
          onClick={() => handleSaveLocation(tempPosition)}
        >
          ✅ Save Location
        </button>
      )}
    </div>
  );
}
