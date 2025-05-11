import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
      <NavLink to="/my-account" style={{ marginRight: "1rem" }}>
        Home
      </NavLink>
      <NavLink to="/books" style={{ marginRight: "1rem" }}>
        Books
      </NavLink>
      <NavLink to="/chats" style={{ marginRight: "1rem" }}>
        Chats
      </NavLink>
      <NavLink to="/swaps" style={{ marginRight: "1rem" }}>
        Swaps
      </NavLink>
      <NavLink to="/logout">
        Logout
      </NavLink>
    </nav>
  );
}
