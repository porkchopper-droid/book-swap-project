import { Outlet } from "react-router-dom";
import Layout from "../components/Layout";
import PrivateRoute from "../components/PrivateRoute";
import { SocketProvider } from "../contexts/SocketContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoutes() {
  const { user } = useAuth();

  // If flagged, skip the layout entirely
  if (user?.isFlagged) {
    return (
      <PrivateRoute>
        <Outlet />
      </PrivateRoute>
    );
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
