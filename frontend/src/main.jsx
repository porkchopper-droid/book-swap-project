import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import "../node_modules/leaflet/dist/leaflet.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_API_URL;

// Inject Umami script dynamically
if (import.meta.env.VITE_UMAMI_ID) {
  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://cloud.umami.is/script.js";
  script.setAttribute("data-website-id", import.meta.env.VITE_UMAMI_ID);
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
