import { useEffect, useState } from "react";
import SwapCard from "../components/SwapCard";
import SwapModal from "../components/SwapModal";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import SwapSVGBackgroundGrid from "../components/SwapSVGBackgroundGrid.jsx";
import "./SwapsPage.scss";

export default function SwapsPage() {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [selectedSwap, setSelectedSwap] = useState(null); // for modal
  const [swapResponseMessage, setSwapResponseMessage] = useState("");

  const { user } = useAuth();

  const tabOptions = [
    { label: "🔄 Active", value: "active" },
    { label: "❌ Declined", value: "declined" },
    { label: "✅ Completed", value: "completed" },
    { label: "📦 Archived", value: "archived" },
    { label: "⏳ Expired", value: "expired" },
    { label: "🚨 Reported", value: "reported" },
    { label: "🚫 Cancelled", value: "cancelled" },
  ];

  const swapId = selectedSwap?._id;
  const myBook = selectedSwap?.requestedBook;
  const theirBook = selectedSwap?.offeredBook;

  const filteredSwaps = swaps.filter((swap) => {
    const isUserFrom = user._id === swap.from._id;
    const userArchived = isUserFrom ? swap.fromArchived : swap.toArchived;

    switch (activeTab) {
      case "active":
        return ["pending", "accepted"].includes(swap.status) && !userArchived;
      case "declined":
        return swap.status === "declined" && !userArchived;
      case "completed":
        return swap.status === "completed" && !userArchived;
      case "archived":
        return userArchived === true;
      case "expired":
        return swap.status === "expired";
      case "reported":
        return swap.status === "reported";
      case "cancelled":
        return swap.status === "cancelled";
      default:
        return true; // fallback
    }
  });

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/swaps/mine`, {
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

  const handleResolve = (swapId) => {
    const swap = swaps.find((s) => s._id === swapId);
    if (swap) setSelectedSwap(swap);
  };

  const handleAccept = async (swapId) => {
    try {
      await axios.patch(
        `/api/swaps/${swapId}/respond`,
        {
          response: "accept",
          toMessage: swapResponseMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchSwaps();
      setSelectedSwap(null);
      setSwapResponseMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (swapId) => {
    try {
      await axios.patch(
        `/api/swaps/${swapId}/respond`,
        {
          response: "decline",
          toMessage: swapResponseMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchSwaps();
      setSelectedSwap(null);
      setSwapResponseMessage("");
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

  const handleReport = async (swapId) => {
    const confirm = window.confirm(
      "Are you sure you want to report this swap?"
    );
    if (!confirm) return;

    try {
      await axios.patch(`/api/swaps/${swapId}/report`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchSwaps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSwap = async (swapId) => {
    const confirm = window.confirm(
      "Are you sure you want to cancel this swap?"
    );
    if (!confirm) return;

    try {
      await axios.patch(`/api/swaps/${swapId}/cancel`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Remove or update swap in UI
      setSwaps((prev) => prev.filter((s) => s._id !== swapId));
      fetchSwaps();
    } catch (err) {
      alert("Failed to cancel swap.");
      console.error(err);
    }
  };

  return (
    <>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <div className="swap-tabs">
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

          <div className="swaps-container">
            <SwapSVGBackgroundGrid />
            {loading ? (
              <p>Loading swaps...</p>
            ) : filteredSwaps.length === 0 ? (
              <p>No {activeTab} swaps to show.</p>
            ) : (
              filteredSwaps.map((swap) => (
                <SwapCard
                  key={swap._id}
                  swap={swap}
                  onResolve={handleResolve}
                  handleMarkCompleted={handleMarkCompleted}
                  handleArchive={handleArchive}
                  handleUnarchive={handleUnarchive}
                  handleReport={handleReport}
                  handleCancelSwap={handleCancelSwap}
                />
              ))
            )}
          </div>
        </>
      )}

      {selectedSwap && (
        <>
          <SwapModal
            swap={selectedSwap}
            myBook={myBook}
            theirBook={theirBook}
            message={swapResponseMessage}
            setMessage={setSwapResponseMessage}
            onAccept={() => handleAccept(swapId)}
            onDecline={() => handleDecline(swapId)}
            onClose={() => setSelectedSwap(null)}
            mode="resolve"
          />
        </>
      )}
    </>
  );
}
