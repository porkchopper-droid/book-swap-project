import Book from "../models/Book.js";
import User from "../models/User.js";
import SwapProposal from "../models/SwapProposal.js";

export const createSwapProposal = async (req, res) => {
  try {
    const { to, offeredBook, requestedBook, fromMessage } = req.body;

    if (!to || !offeredBook || !requestedBook) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const newProposal = new SwapProposal({
      from: req.user._id,
      to,
      offeredBook,
      requestedBook,
      fromAccepted: true,
      toAccepted: false,
      status: "pending", // BY DEFAULT, DUH!!
      fromMessage,
    });

    const saved = await newProposal.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create swap proposal." });
  }
};

export const respondToSwapProposal = async (req, res) => {
  try {
    const { swapId } = req.params;
    const { response, toMessage } = req.body; // response = "accept" or "decline"

    if (!["accept", "decline"].includes(response)) {
      return res.status(400).json({ message: "Invalid response." });
    }

    const proposal = await SwapProposal.findById(swapId);

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found." });
    }

    // Only the recipient can respond
    if (String(proposal.to) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    if (proposal.status !== "pending") {
      return res.status(400).json({ message: "Proposal already resolved." });
    }

    if (response === "decline") {
      proposal.status = "declined";
      await proposal.save();
      return res.json({ message: "Proposal declined.", proposal });
    }

    // If accepted
    proposal.toAccepted = true;
    proposal.status = "accepted";
    proposal.acceptedAt = new Date(); // timestamp locked
    if (toMessage) {
      proposal.toMessage = toMessage;
    }
    await proposal.save();

    // Mark both books as booked
    await Book.findByIdAndUpdate(proposal.offeredBook, { status: "booked" });
    await Book.findByIdAndUpdate(proposal.requestedBook, { status: "booked" });

    // Safe partner selection
    const fromUser = await User.findById(proposal.from).select(
      "username email"
    );
    const toUser = await User.findById(proposal.to).select("username email");
    const partner =
      String(req.user._id) === String(proposal.from._id || proposal.from)
        ? toUser
        : fromUser;

    res.json({
      message: "Proposal accepted. Books are now booked.",
      proposal,
      partnerContact: {
        username: partner.username,
        email: partner.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to respond to proposal." });
  }
};

export const getMySwaps = async (req, res) => {
  try {
    const userId = req.user._id;

    const swaps = await SwapProposal.find({
      $or: [{ from: userId }, { to: userId }],
    })
      .populate("offeredBook")
      .populate("requestedBook")
      .populate("from", "username profilePicture")
      .populate("to", "username profilePicture")
      .sort({ updatedAt: -1 }); // optional, newest first

    res.json(swaps);
  } catch (err) {
    console.error("Failed to fetch swaps:", err);
    res.status(500).json({ message: "Server error fetching your swaps." });
  }
};

export const getSwapById = async (req, res) => {
  try {
    const swap = await SwapProposal.findById(req.params.swapId)
      .populate("offeredBook", "title")
      .populate("requestedBook", "title")
      .populate("from", "username profilePicture")
      .populate("to", "username profilePicture");

    if (!swap) {
      return res.status(404).json({ message: "Swap not found" });
    }

    res.status(200).json(swap);
  } catch (err) {
    console.error("Failed to fetch swap:", err);
    res.status(500).json({ message: "Server error fetching swap." });
  }
};

export const markSwapAsCompleted = async (req, res) => {
  try {
    const { swapId } = req.params;
    const proposal = await SwapProposal.findById(swapId);

    if (!proposal) {
      return res.status(404).json({ message: "Swap not found." });
    }

    // Only allow if status is accepted
    if (proposal.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Only accepted swaps can be marked completed." });
    }

    // Only participants can mark as completed
    const userId = req.user._id.toString();
    if (![proposal.from.toString(), proposal.to.toString()].includes(userId)) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // separate completion flags
    if (proposal.fromCompleted === undefined) proposal.fromCompleted = false;
    if (proposal.toCompleted === undefined) proposal.toCompleted = false;

    if (userId === proposal.from.toString()) {
      proposal.fromCompleted = true;
    } else if (userId === proposal.to.toString()) {
      proposal.toCompleted = true;
    }

    // Final completion check
    if (proposal.fromCompleted && proposal.toCompleted) {
      proposal.status = "completed";
      proposal.completedAt = new Date();

      // Transfer book ownership + update status
      const [offeredBook, requestedBook] = await Promise.all([
        Book.findById(proposal.offeredBook),
        Book.findById(proposal.requestedBook),
      ]);

      if (offeredBook && requestedBook) {
        offeredBook.status = "swapped";
        requestedBook.status = "swapped";

        // Swap owners
        offeredBook.user = proposal.to;
        requestedBook.user = proposal.from;

        await offeredBook.save();
        await requestedBook.save();
      }
    }

    await proposal.save();

    res.json({
      message:
        proposal.status === "completed"
          ? "Swap fully completed."
          : "Marked as completed. Awaiting other user.",
      proposal,
    });
  } catch (err) {
    console.error("Failed to mark completed:", err);
    res
      .status(500)
      .json({ message: "Server error marking swap as completed." });
  }
};

export const markSwapAsArchived = async (req, res) => {
  try {
    const { swapId } = req.params;

    const proposal = await SwapProposal.findById(swapId);

    if (!proposal) {
      return res.status(404).json({ message: "Swap not found." });
    }

    // Only allow if status is completed
    if (proposal.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Only swaps marked as 'Completed' can be archived." });
    }

    // Only participants can mark as archived
    const userId = req.user._id.toString();
    if (![proposal.from.toString(), proposal.to.toString()].includes(userId)) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    if (userId === proposal.from.toString()) {
      proposal.fromArchived = true;
    } else if (userId === proposal.to.toString()) {
      proposal.toArchived = true;
    }

    await proposal.save();

    res.json({ message: "Swap marked as archived.", proposal });
  } catch (err) {
    console.error("Failed to mark archived:", err);
    res.status(500).json({ message: "Server error marking swap as archived." });
  }
};

export const unarchiveSwap = async (req, res) => {
  try {
    const { swapId } = req.params;
    const userId = req.user._id.toString();

    const proposal = await SwapProposal.findById(swapId);

    if (!proposal) {
      return res.status(404).json({ message: "Swap not found." });
    }

    const isUserFrom = userId === proposal.from.toString();
    const isUserTo = userId === proposal.to.toString();

    if (!isUserFrom && !isUserTo) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // Unarchive only for the current user
    if (isUserFrom) {
      proposal.fromArchived = false;
    } else if (isUserTo) {
      proposal.toArchived = false;
    }

    await proposal.save();

    res.json({ message: "Swap unarchived for current user", proposal });
  } catch (err) {
    console.error("Unarchive error:", err);
    res.status(500).json({ message: "Server error unarchiving." });
  }
};

export const reportSwap = async (req, res) => {
  try {
    const { swapId } = req.params;
    const swap = await SwapProposal.findById(swapId);

    if (!swap) {
      return res.status(404).json({ message: "Swap not found." });
    }

    // Only participants can report
    const userId = req.user._id.toString();
    if (![swap.from.toString(), swap.to.toString()].includes(userId)) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // Update swap and books
    swap.status = "reported";
    swap.reportedAt = new Date();
    await swap.save();

    await Book.findByIdAndUpdate(swap.offeredBook, { status: "reported" });
    await Book.findByIdAndUpdate(swap.requestedBook, { status: "reported" });

    res.json({ message: "Swap and books reported.", swap });
  } catch (err) {
    console.error("Error reporting swap:", err);
    res.status(500).json({ message: "Server error reporting swap." });
  }
};
