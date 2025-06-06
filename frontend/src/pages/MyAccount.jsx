import { useEffect, useState } from "react";
import axios from "axios";
import MapComponent from "../components/MapComponent";
import UserInfoModal from "../components/UserInfoModal";
import "./MyAccount.scss";

export default function MyAccount() {
  const [showModal, setShowModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [forceReload, setForceReload] = useState(false);
  const [editLocation, setEditLocation] = useState(false);

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

  const refreshUserInfo = async () => {
    try {
      const res = await axios.get("/api/users/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setUserInfo(res.data);
    } catch (err) {
      console.error("Failed to refresh user info:", err);
    }
  };

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axios.get("/api/users/me/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch user stats:", err);
      }
    };

    fetchUserStats();
  }, []);

  if (!userInfo) return <p>Loading...</p>;

  return (
    <div className="account-layout">
      <aside>
        {showModal && (
          <UserInfoModal
            user={userInfo}
            onClose={() => setShowModal(false)}
            onUpdate={(updated) => {
              setUserInfo(updated);
              setForceReload((prev) => !prev); // 💥 trigger map reload
            }}
          />
        )}
        <div className="my-stats">
          <h3>📊 My Stats</h3>
          <ul>
            <li>Books available: {stats ? stats.booksCount : "Loading..."}</li>
            <li>
              Swaps made: {stats ? stats.totalBooksExchanged : "Loading..."}
            </li>
            <li>Favorite genre: {stats?.favoriteGenre || "N/A"}</li>
            <li>
              Oldest book:{" "}
              {stats?.oldestBook
                ? `${stats.oldestBook.title} (${stats.oldestBook.year})`
                : "N/A"}
            </li>
            <li>
              Most popular book:{" "}
              {stats?.mostPopularBook
                ? `${stats.mostPopularBook.title} (${stats.mostPopularBook.swapCount} swaps)`
                : "N/A"}
            </li>
            <li>
              Last swap date:{" "}
              {stats?.lastSwapDate
                ? new Date(stats.lastSwapDate).toLocaleDateString()
                : "N/A"}
            </li>
          </ul>
        </div>

        <div className="my-info">
          <div className="my-info-edit">
            <h3>👤 My info</h3>
            <button
              aria-label="Edit Info"
              title="Edit Info"
              className="my-info-edit-button"
              onClick={() => setShowModal(true)}
            >
              ✏️
            </button>
          </div>
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
        <div className="badges-container">
          <h3>🏅 Achievements</h3>
          <div className="badges">
            {stats?.badges.map((badge, idx) => (
              <div
                key={idx}
                className={`badge ${badge.achieved ? "achieved" : "locked"}`}
                title={badge.name}
              >
                {badge.name.slice(-2)}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main>
        {/* <h2>📍 People Around You</h2> */}
        <MapComponent
          forceReload={forceReload}
          editLocation={editLocation}
          setEditLocation={setEditLocation}
          refreshUserInfo={refreshUserInfo}
        />
      </main>
    </div>
  );
}
