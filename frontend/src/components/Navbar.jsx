import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import "./Navbar.scss";

export default function Navbar() {
  const { user } = useAuth();
  const { unreadCounts } = useNotification();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Sum all unread counts into a single number
  const totalUnread = Object.values(unreadCounts).reduce((sum, cnt) => sum + (cnt || 0), 0);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <nav className="navbar" ref={menuRef}>
      <div className="nav-left">
        <NavLink to="/account" className="account-link">
          {user?.profilePicture && user.profilePicture.trim() !== "" ? (
            <img src={user.profilePicture} alt="Profile" />
          ) : (
            <div className="avatar-fallback">{user?.username?.charAt(0).toUpperCase() || "?"}</div>
          )}
          <div>
            <h4>Hello, {user?.username || "Guest"}</h4>
          </div>
        </NavLink>
      </div>

      <div className={`burger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>

      <div className={`nav-center ${menuOpen ? "open" : ""}`}>
        <NavLink to="/books" onClick={() => setMenuOpen(false)}>
          Books
        </NavLink>
        <NavLink to="/chats" className="chats-link" onClick={() => setMenuOpen(false)}>
          Chats
          {totalUnread > 0 && <span className="badge">{totalUnread}</span>}
        </NavLink>
        <NavLink to="/swaps" onClick={() => setMenuOpen(false)}>
          Swaps
        </NavLink>
        {menuOpen && (
          <NavLink to="/logout" onClick={() => setMenuOpen(false)}>
            Logout
          </NavLink>
        )}
      </div>

      <div className={`nav-right ${menuOpen ? "open" : ""}`}>
        {!menuOpen && (
          <NavLink to="/logout" onClick={() => setMenuOpen(false)}>
            Logout
          </NavLink>
        )}
      </div>
    </nav>
  );
}
