import { Outlet } from "react-router-dom";
import Layout from "../components/Layout";
import PrivateRoute from "../components/PrivateRoute";
import { SocketProvider } from "../contexts/SocketContext";

export default function ProtectedRoutes() {
  return (
    <PrivateRoute>
      <SocketProvider>
        <Layout>
          <Outlet />
        </Layout>
      </SocketProvider>
    </PrivateRoute>
  );
}
