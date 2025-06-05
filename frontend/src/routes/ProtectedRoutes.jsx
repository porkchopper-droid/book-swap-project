import { Outlet } from "react-router-dom";
import Layout from "../components/Layout";
import PrivateRoute from "../components/PrivateRoute";
import { SocketProvider } from "../contexts/SocketContext";
import { NotificationProvider } from "../contexts/NotificationContext";

export default function ProtectedRoutes() {
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
