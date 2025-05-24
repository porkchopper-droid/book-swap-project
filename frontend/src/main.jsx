import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import "../node_modules/leaflet/dist/leaflet.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:6969";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
