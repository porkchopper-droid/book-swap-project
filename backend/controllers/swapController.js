import Book from "../models/Book.js";
import User from "../models/User.js"
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
    const { id } = req.params;
    const { action, toMessage } = req.body; // action = "accept" or "decline"

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    const proposal = await SwapProposal.findById(id);

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found." });
    }

    // Only the recipient can respond
    console.log("req.user._id:", req.user._id);
    console.log("proposal.to:", proposal.to);
    console.log(
      "String comparison:",
      String(req.user._id) === String(proposal.to)
    );
    
    if (String(proposal.to) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized." });
    }
    

    if (proposal.status !== "pending") {
      return res.status(400).json({ message: "Proposal already resolved." });
    }

    if (action === "decline") {
      proposal.status = "declined";
      await proposal.save();
      return res.json({ message: "Proposal declined.", proposal });
    }

    // If accepted
    proposal.toAccepted = true;
    proposal.status = "accepted";
    if (toMessage) {
      proposal.toMessage = toMessage;
    }
    await proposal.save();

    // Mark both books as booked
    await Book.findByIdAndUpdate(proposal.offeredBook, { status: "booked" });
    await Book.findByIdAndUpdate(proposal.requestedBook, { status: "booked" });

    // Debug logs
    console.log("req.user._id:", req.user._id);
    console.log("proposal.from:", proposal.from);

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
