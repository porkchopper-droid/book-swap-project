import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import "./Layout.scss";

export default function Layout() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <Outlet />
    </div>
  );
}
