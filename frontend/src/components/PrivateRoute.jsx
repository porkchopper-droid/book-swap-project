import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" />;
  }

  // ⚠️ If flagged and NOT already at /account/restricted → redirect
  if (user.isFlagged && location.pathname !== "/account/restricted") {
    return <Navigate to="/account/restricted" />;
  }

  // ✅ If already at /account/restricted, allow it
  return children;
}
