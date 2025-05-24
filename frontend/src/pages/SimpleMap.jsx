import { MapContainer, TileLayer } from "react-leaflet";
import "../node_modules/leaflet/dist/leaflet.css";

export default function SimpleMap() {
  return (
    <div style={{ height: "90vh", width: "100%" }}>
      <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
      </MapContainer>
    </div>
  );
}