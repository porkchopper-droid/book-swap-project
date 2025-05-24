import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import "./MapPage.scss"; // (optional)

export default function MapPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const res = await axios.get("/api/map/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch map data", err);
      }
    };

    fetchMapData();
  }, []);

  return (
    <div className="map-page">
      <MapContainer center={[51.505, -0.09]} zoom={4} scrollWheelZoom style={{ height: "90vh", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {users.map((user) => {
          const [lon, lat] = user.location.coordinates;

          return (
            <Marker key={user._id} position={[lat, lon]}>
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
    </div>
  );
}
