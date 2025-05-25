import { useEffect, useState } from "react";
import axios from "axios";
import Map from "../components/Map";
import UserInfoModal from "../components/UserInfoModal";
import "./MyAccount.scss";

export default function MyAccount() {
  const [showModal, setShowModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get("/api/users/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUserInfo(res.data);
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };

    fetchUserInfo();
  }, []);

  if (!userInfo) return <p>Loading...</p>;

  return (
    <div className="account-layout">
      <aside>
        {showModal && (
            <UserInfoModal
              user={userInfo}
              onClose={() => setShowModal(false)}
              onUpdate={(updated) => setUserInfo(updated)}
            />
          )}
        <div className="my-stats">
          <h2>📊 My Stats</h2>
          <ul>
            <li>Books available: 12</li>
            <li>Swaps made: 5</li>
            <li>Distance traveled: 834 km</li>
          </ul>
        </div>
        <div className="my-info">
          <h2>👤 My info</h2>
          <button onClick={() => setShowModal(true)}>✏️ Edit Info</button>
          <ul>
            <li>
              <strong>Username:</strong> {userInfo.username}
            </li>
            <li>
              <strong>Email:</strong> {userInfo.email}
            </li>
            <li>
              <strong>Location:</strong>{" "}
              {userInfo.location.coordinates.join(", ")}
            </li>
          </ul>
        </div>
      </aside>

      <main>
        <h2>📍 People Around You</h2>
        <Map />
      </main>
    </div>
  );
}
