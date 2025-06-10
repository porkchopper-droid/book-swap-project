import { Link } from "react-router-dom";

import "./Careers.scss";

export default function CareersPage() {
  return (
    <div className="careers-page">
      <h1>Careers</h1>
      <p>
        So, you're curious about joining BookBook? Honestly, we're not some big, fancy startup — but
        we're a bunch who likes books, swapping ideas, and making things a little better every day.
      </p>
      <p>
        If you're passionate about books, technology, and community (or just want to
        escape your current job and try something new), we'd love to{" "}
        <Link to="/contact-us">hear</Link>{" "}from you.
        Reach out, and let's see if we're a fit.
        
      </p>
      <p>
          Between us — I'm also on the lookout for that perfect gig myself. Maybe we can find it
          together? 😉
        </p>
    </div>
  );
}
