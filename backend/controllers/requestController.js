import Request from "../models/Request.js";
import Book from "../models/Book.js";

export const createRequest = async (req, res) => {
  try {
    const { bookId, message } = req.body;

    // 1. Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    // 2. Prevent user from requesting their own book
    if (book.user.toString() === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot request your own book." });
    }

    // 3. Create the request
    const newRequest = new Request({
      book: book._id,
      from: req.user.id,
      to: book.user,
      message,
    });

    const saved = await newRequest.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create request." });
  }
};

/* ---------------- GET INCOMING REQUESTS --------------- */

export const getIncomingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ to: req.user.id })
      .populate("from", "username city country")
      .populate("book", "title author genre");

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch incoming requests." });
  }
};

/* ---------------- GET OUTGOING REQUESTS --------------- */

export const getOutgoingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ from: req.user.id })
      .populate("to", "username city country")
      .populate("book", "title author genre");

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch outgoing requests." });
  }
};

/* -------------- ACCEPT OR DECLINE REQUEST ------------- */

export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params; // ID of the request
    const { status } = req.body; // patched status...

    // Validate status
    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    // Find the request in MongoDB
    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    // Only the recipient can update it
    if (request.to.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // Update and save
    request.status = status;

    // Auto-update book status if accepted
    if (status === "accepted") {
      await Book.findByIdAndUpdate(request.book, { status: "booked" });
    }
    await request.save();

    res.json({ message: `Request ${status}.`, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update request status." });
  }
};
