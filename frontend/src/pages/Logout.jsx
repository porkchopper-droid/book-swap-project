import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

export default function Logout() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const doLogout = async () => {
      logout(); // custom function: clears token + user from localStorage
      setUser(null); // clears in-memory user state
      navigate("/"); // redirects to "/"
    };
    doLogout(); // trigger it
  }, [navigate, setUser]);

  return <p>Logging you out...</p>;
}
