import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token");         // Clear the token
    navigate("/");                       // Redirect to landing
  }, []);

  return <p>Logging you out...</p>;
}
