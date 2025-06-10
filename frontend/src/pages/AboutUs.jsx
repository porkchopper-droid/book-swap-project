import { Link } from "react-router-dom";
import "./AboutUs.scss";

export default function AboutUsPage() {
  return (
    <div className="about-us-page">
      <h1>About Us</h1>
      <p>
        BookBook is more than a book swapping platform — it's a community. We're passionate about
        connecting readers and sharing stories across borders.
      </p>
      <p>
        Our mission: make book swapping seamless, personal, and fun. Whether you're in Berlin or
        Bangkok, we're here to help you swap your next favorite read!
      </p>
      <p>
        We will be happy if you <Link to="/contact-us">drop</Link> us a line or two.
      </p>
      <p>Happy swapping 📖</p>
    </div>
  );
}
