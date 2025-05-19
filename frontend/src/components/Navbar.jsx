import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.scss";

export default function Navbar() {
  const { user } = useAuth();
  return (
    <nav className="navbar">
      <div className="nav-left">
        <NavLink to="/my-account" className="profile-link">
          {user?.profilePicture && user.profilePicture.trim() !== "" ? (
            <img src={user.profilePicture} alt="Profile" />
          ) : (
            <div className="avatar-fallback">
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div>
            <h3>Hello, {user?.username || "Guest"}</h3>
          </div>
        </NavLink>
      </div>

      <div className="nav-center">
        <NavLink to="/books">Books</NavLink>
        <NavLink to="/chats">Chats</NavLink>
        <NavLink to="/swaps">Swaps</NavLink>
      </div>

      <div className="nav-right">
        <NavLink to="/logout">Logout</NavLink>
      </div>
    </nav>
  );
}
