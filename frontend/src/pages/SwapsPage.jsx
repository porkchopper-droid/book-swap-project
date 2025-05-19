import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SwapsPage.scss"; // Create this later

export default function SwapsPage() {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:6969/api/swaps/mine", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setSwaps(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch swaps:", err);
        setError("Could not load swaps.");
        setLoading(false);
      });
  }, []);

  const handleAccept = async (swapId) => {
    try {
      await axios.patch(`/api/swaps/${swapId}/respond`, {
        response: "accepted",
      });
      fetchSwaps(); // or update state manually if you want
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (swapId) => {
    try {
      await axios.patch(`/api/swaps/${swapId}/respond`, {
        response: "declined",
      });
      fetchSwaps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkCompleted = async (swapId) => {
    try {
      await axios.patch(`/api/swaps/${swapId}/respond`, {
        response: "completed",
      });
      fetchSwaps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (swapId) => {
    try {
      await axios.patch(`/api/swaps/${swapId}/respond`, {
        response: "archive",
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

      <div className="swaps-grid">
        {swaps.map((swap) => (
          <div key={swap._id} className="swap-card">
            <p>
              <strong>{swap.offeredBook.title}</strong> ⇄{" "}
              <strong>{swap.requestedBook.title}</strong>
            </p>
            <p>
              @{swap.from.username} ⇄ @{swap.to.username}
            </p>
            <p>
              Status:{" "}
              <span className={`status ${swap.status}`}>{swap.status}</span>
            </p>

            {swap.fromMessage && <p>💬 {swap.fromMessage}</p>}
            {swap.toMessage && <p>💬 {swap.toMessage}</p>}

            <button onClick={() => navigate(`/chat/${swap._id}`)}>
              Go to Chat
            </button>
            {swap.status === "pending" && (
              <>
                <button onClick={() => handleAccept(swap._id)}>Accept</button>
                <button onClick={() => handleDecline(swap._id)}>Decline</button>
              </>
            )}
            {swap.status === "accepted" && !swap.isCompleted && (
              <button onClick={() => handleMarkCompleted(swap._id)}>
                Mark Completed
              </button>
            )}

            {swap.isCompleted && !swap.isArchived && (
              <button onClick={() => handleArchive(swap._id)}>Archive</button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
