import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={{ textAlign: "center", marginTop: "5rem" }}>
      <h1>📚 Welcome to BookSwap</h1>
      <p>Find books. Swap books. Make connections.</p>
      <div style={{ marginTop: "2rem" }}>
        <Link to="/login">
          <button style={{ marginRight: "1rem" }}>Login</button>
        </Link>
        <Link to="/register">
          <button>Register</button>
        </Link>
      </div>
    </div>
  );
}
