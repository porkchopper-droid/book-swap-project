import { useEffect, useState } from "react";
import SwapCard from "../components/SwapCard";
import "./SwapsPage.scss";
import axios from "axios";

export default function SwapsPage() {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const tabOptions = [
    { label: "🔄 Active", value: "active" },
    { label: "❌ Declined", value: "declined" },
    { label: "✅ Completed", value: "completed" },
    { label: "📦 Archived", value: "archived" },
  ];

  const filteredSwaps = swaps.filter((swap) => {
    switch (activeTab) {
      case "active":
        return (
          ["pending", "accepted"].includes(swap.status) && !swap.isCompleted
        );
      case "declined":
        return swap.status === "declined";
      case "completed":
        return swap.isCompleted === true && !swap.isArchived;
      case "archived":
        return swap.isArchived === true;
      default:
        return true; // fallback if something breaks
    }
  });

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/swaps/mine", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSwaps(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch swaps:", err);
      setError("Could not load swaps.");
      setLoading(false);
    }
  };

  const handleAccept = async (swapId) => {
    try {
      await axios.patch(
        `/api/swaps/${swapId}/respond`,
        {
          response: "accepted",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchSwaps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (swapId) => {
    try {
      await axios.patch(
        `/api/swaps/${swapId}/respond`,
        {
          response: "declined",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchSwaps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkCompleted = async (swapId) => {
    try {
      await axios.patch(`/api/swaps/${swapId}/complete`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchSwaps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (swapId) => {
    try {
      await axios.patch(`/api/swaps/${swapId}/archive`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchSwaps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnarchive = async (swapId) => {
    try {
      await axios.patch(`/api/swaps/${swapId}/unarchive`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchSwaps();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {loading && <p>Loading swaps...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="tabs">
        {tabOptions.map((tab) => (
          <button
            key={tab.value}
            className={activeTab === tab.value ? "active" : ""}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="swaps-grid">
        {filteredSwaps.length === 0 ? (
          <p>No {activeTab} swaps to show.</p>
        ) : (
          filteredSwaps.map((swap) => (
            <SwapCard
              key={swap._id}
              swap={swap}
              handleAccept={handleAccept}
              handleDecline={handleDecline}
              handleMarkCompleted={handleMarkCompleted}
              handleArchive={handleArchive}
              handleUnarchive={handleUnarchive}
            />
          ))
        )}
      </div>
    </>
  );
}
