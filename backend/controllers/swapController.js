import Book from "../models/Book.js";
import User from "../models/User.js";
import SwapProposal from "../models/SwapProposal.js";
import { sendSwapProposalEmail } from "../utils/sendSwapProposalEmail.js";
import { sendSwapResponseEmail } from "../utils/sendSwapResponseEmail.js";
import { debugLog } from "../utils/debug.js";

export const createSwapProposal = async (req, res) => {
  try {
    // 1️⃣ Pull out fields first
    const { to, offeredBook, requestedBook, fromMessage } = req.body;

    if (!to || !offeredBook || !requestedBook) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // 2️⃣ Look up both books
    const offered = await Book.findById(offeredBook);
    const requested = await Book.findById(requestedBook);

    if (!offered || !requested || offered.status === "deleted" || requested.status === "deleted") {
      return res.status(400).json({ message: "One of the books has been deleted." });
    }

    // 3️⃣ Duplicate-proposal check (unchanged)
    const existing = await SwapProposal.findOne({
      status: "pending",
      $or: [
        {
          offeredBook,
          requestedBook,
        },
        {
          offeredBook: requestedBook,
          requestedBook: offeredBook,
        },
      ],
    });
    if (existing) {
      return res.status(400).json({
        message: "You have already proposed a swap with these books. Patience is a virtue!?",
      });
    }

    // 4️⃣ Create & save proposal (unchanged)
    const saved = await SwapProposal.create({
      from: req.user._id,
      to,
      offeredBook,
      requestedBook,
      fromAccepted: true,
      toAccepted: false,
      status: "pending", // BY DEFAULT, DUH!!
      fromMessage,
    });

    // 5️⃣ Notify recipient via email
    const recipientUser = await User.findById(to).select("username email");
    if (recipientUser) {
      const populatedSwap = await SwapProposal.findById(saved._id)
        .populate("offeredBook", "title")
        .populate("requestedBook", "title");
      await sendSwapProposalEmail(recipientUser.email, {
        recipientUser: recipientUser.username,
        sender: req.user.username,
        offeredBook: populatedSwap.offeredBook.title,
        requestedBook: populatedSwap.requestedBook.title,
        fromMessage: populatedSwap.fromMessage,
        link: `${process.env.FRONTEND_URL}/swaps`,
      });
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create swap proposal." });
  }
};

export const respondToSwapProposal = async (req, res) => {
  debugLog("Request body:", req.body);
  debugLog("Swap ID from params:", req.params.swapId, typeof req.params.swapId);
  try {
    const { swapId } = req.params;
    const { response, toMessage } = req.body; // response = "accept" or "decline"
    debugLog("swapId being passed:", swapId, typeof swapId);
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
      // DECLINED
      proposal.status = "declined";
      debugLog("Attached toMessage:", toMessage);
      if (toMessage) {
        proposal.toMessage = toMessage;
      }

      await proposal.save(); // DECLINED saved to mongoDB

      // Send email to the initiator
      const initiatorUser = await User.findById(proposal.from).select("username email");
      if (initiatorUser) {
        // Populate the books so we have titles
        const populatedProposal = await SwapProposal.findById(proposal._id)
          .populate("offeredBook", "title author")
          .populate("requestedBook", "title author");

        await sendSwapResponseEmail(initiatorUser.email, {
          recipientUser: initiatorUser.username,
          responder: req.user.username,
          offeredBook: populatedProposal.offeredBook.title,
          offeredBookAuthor: populatedProposal.offeredBook.author,
          requestedBook: populatedProposal.requestedBook.title,
          requestedBookAuthor: populatedProposal.requestedBook.author,
          toMessage: toMessage || "",
          response: "declined",
          link: `${process.env.FRONTEND_URL}/swaps`,
        });
      }

      return res.json({ message: "Proposal declined.", proposal });
    }

    // If accepted
    proposal.toAccepted = true;
    proposal.status = "accepted";
    proposal.acceptedAt = new Date(); // timestamp locked
    if (toMessage) {
      proposal.toMessage = toMessage;
    }

    await proposal.save(); // ACCEPTED saved to mongoDB

    // Send email to the initiator
    const initiatorUser = await User.findById(proposal.from).select("username email");
    if (initiatorUser) {
      // Populate the books so we have titles
      const populatedProposal = await SwapProposal.findById(proposal._id)
        .populate("offeredBook", "title author")
        .populate("requestedBook", "title author");

      await sendSwapResponseEmail(initiatorUser.email, {
        recipientUser: initiatorUser.username,
        responder: req.user.username,
        offeredBook: populatedProposal.offeredBook.title,
        offeredBookAuthor: populatedProposal.offeredBook.author,
        requestedBook: populatedProposal.requestedBook.title,
        requestedBookAuthor: populatedProposal.requestedBook.author,
        toMessage: toMessage || "",
        response: "accepted",
        link: `${process.env.FRONTEND_URL}/swaps`,
      });
    }

    // Mark both books as booked
    await Book.findByIdAndUpdate(proposal.offeredBook, { status: "booked" });
    await Book.findByIdAndUpdate(proposal.requestedBook, { status: "booked" });

    // Decline all other pending proposals involving the same books
    await SwapProposal.updateMany(
      {
        _id: { $ne: proposal._id },
        status: "pending",
        $or: [
          { offeredBook: proposal.offeredBook }, // ✅ You're offering it elsewhere (you must own it)
          { requestedBook: proposal.offeredBook }, // 🔥 Someone else is asking for your book
          // { offeredBook: proposal.requestedBook },  ❓❓❓ TRASH
          { requestedBook: proposal.requestedBook }, // ✅ Someone else is trying to get the same book
        ],
      },
      { status: "declined" }
    );

    // Safe partner selection
    const fromUser = await User.findById(proposal.from).select("username email");
    const toUser = await User.findById(proposal.to).select("username email");
    const partner =
      String(req.user._id) === String(proposal.from._id || proposal.from) ? toUser : fromUser;

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
      return res.status(400).json({ message: "Only accepted swaps can be marked completed." });
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
    res.status(500).json({ message: "Server error marking swap as completed." });
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
      return res.status(400).json({ message: "Only swaps marked as 'Completed' can be archived." });
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

    // checking if the swap exists
    if (!swap) {
      return res.status(404).json({ message: "Swap not found." });
    }

    // only accepted swaps can be reported
    if (swap.status !== "accepted") {
      return res.status(400).json({ message: "Only accepted swaps can be reported." });
    }

    const userId = req.user._id.toString();

    // Only participants can report
    if (![swap.from.toString(), swap.to.toString()].includes(userId)) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // Update swap and books
    swap.status = "reported";
    swap.reportedAt = new Date();
    await swap.save();

    await Book.findByIdAndUpdate(swap.offeredBook, { status: "reported", reportedAt: new Date() });
    await Book.findByIdAndUpdate(swap.requestedBook, {
      status: "reported",
      reportedAt: new Date(),
    });

    // Increment the *other* user's reportedCount
    const otherUserId = userId === String(swap.from) ? String(swap.to) : String(swap.from);
    const otherUser = await User.findById(otherUserId);

    if (otherUser) {
      otherUser.reportedCount = (otherUser.reportedCount || 0) + 1;
      if (otherUser.reportedCount >= 5) {
        otherUser.isFlagged = true; // flag them
        otherUser.flaggedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // for 7 days 😈

        // 🚨 Also mark all their books as reported
        await Book.updateMany({ owner: otherUser._id }, { status: "reported" });
      }
      await otherUser.save();
    }

    res.json({
      message: "Swap and books reported. User's reported count updated.",
      swap,
    });
  } catch (err) {
    console.error("Error reporting swap:", err);
    res.status(500).json({ message: "Server error reporting swap." });
  }
};

export const cancelSwapProposal = async (req, res) => {
  try {
    const { swapId } = req.params;
    const userId = req.user._id;

    const swap = await SwapProposal.findById(swapId);
    if (!swap) {
      return res.status(404).json({ message: "Swap not found." });
    }

    if (String(swap.from) !== String(userId)) {
      return res.status(403).json({ message: "Not authorized to cancel this swap." });
    }

    if (swap.status !== "pending") {
      return res.status(400).json({ message: "Only pending swaps can be cancelled." });
    }

    swap.status = "cancelled";
    swap.cancelledAt = new Date();
    await swap.save();

    res.json({ message: "Swap proposal cancelled successfully.", swap });
  } catch (err) {
    console.error("❌ Cancel failed:", err);
    res.status(500).json({ message: "Something went wrong." });
  }
};
