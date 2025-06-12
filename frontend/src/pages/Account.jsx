import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MapComponent from "../components/MapComponent";
import { IoStatsChartOutline } from "react-icons/io5";
import { GrContactInfo } from "react-icons/gr";
import "./Account.scss";

export default function Account() {
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [forceReload, setForceReload] = useState(false);
  const [editLocation, setEditLocation] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get(`/api/users/account`, {
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
      const res = await axios.get(`/api/users/account`, {
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
        const res = await axios.get(`/api/users/account/stats`, {
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
        <div className="my-stats">
          <h3>
            <IoStatsChartOutline/> My Stats
          </h3>
          <ul>
            <li>
              <strong>Books available:</strong> {stats ? stats.booksCount : "Loading..."}
            </li>
            <li>
              <strong>Swaps made:</strong> {stats ? stats.totalBooksExchanged : "Loading..."}
            </li>
            <li>
              <strong>Favorite genre:</strong> {stats?.favoriteGenre || "N/A"}
            </li>
            <li>
              <strong>Oldest book:</strong>{" "}
              {stats?.oldestBook ? `${stats.oldestBook.title} (${stats.oldestBook.year})` : "N/A"}
            </li>
            <li>
              <strong>Most popular book:</strong>{" "}
              {stats?.mostPopularBook
                ? `${stats.mostPopularBook.title} (${stats.mostPopularBook.swapCount} swaps)`
                : "N/A"}
            </li>
            <li>
              <strong>Last swap date:</strong>{" "}
              {stats?.lastSwapDate ? new Date(stats.lastSwapDate).toLocaleDateString() : "N/A"}
            </li>
          </ul>
        </div>

        <div className="my-info">
          <h3>
            <GrContactInfo style={{ verticalAlign: "middle", fontSize: "24px" }} /> My info
          </h3>

          <ul>
            <li>
              <strong>Username:</strong> {userInfo.username}
            </li>
            <li>
              <strong>Email:</strong> {userInfo.email}
            </li>
            <li>
              <strong>Location:</strong> {userInfo.location.coordinates.join(", ")}
            </li>
          </ul>
        </div>
        <button
          aria-label="My Profile"
          title="My Profile"
          className="my-profile-button"
          onClick={() => navigate("/account/profile")}
        >
          My Profile
        </button>
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
