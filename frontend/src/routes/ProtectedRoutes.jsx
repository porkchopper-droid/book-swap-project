import { Outlet } from "react-router-dom";
import Layout from "../components/Layout";
import PrivateRoute from "../components/PrivateRoute";
import { SocketProvider } from "../contexts/SocketContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import FlaggedUser from "../components/FlaggedUser";

export default function ProtectedRoutes() {
  const { user } = useAuth();

  // 🚨 If flagged, show modal instead of the app
  if (user?.isFlagged) {
    return <FlaggedUser />;
  }

  return (
    <PrivateRoute>
      <SocketProvider>
        <NotificationProvider>
          <Layout>
            <Outlet />
          </Layout>
        </NotificationProvider>
      </SocketProvider>
    </PrivateRoute>
  );
}
