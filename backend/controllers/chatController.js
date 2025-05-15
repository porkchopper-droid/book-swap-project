import Message from "../models/Message.js";
import SwapProposal from "../models/SwapProposal.js";

export const sendMessage = async (req, res) => {
  const { swapId } = req.params;
  const { text } = req.body;

  try {
    // validate swap
    const swap = await SwapProposal.findById(swapId);
    if (!swap || swap.status !== "accepted") {
      return res
        .status(403)
        .json({ message: "Swap not found or not accepted." });
    }

    // Validate user is part of the swap
    const userId = req.user._id.toString();
    const isParticipant = [swap.from.toString(), swap.to.toString()].includes(
      userId
    );
    if (!isParticipant) {
      return res
        .status(403)
        .json({ message: "You are not part of this swap." });
    }

    // Create the message
    const message = new Message({
      swapId,
      sender: userId,
      text,
    });

    const saved = await message.save();
    const populated = await saved.populate("sender", "username");
    res.status(201).json(populated); // send message
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: "Could not send message." });
  }
};

export const getMessages = async (req, res) => {
  const { swapId } = req.params;

  try {
    const swap = await SwapProposal.findById(swapId);
    if (!swap || swap.status !== "accepted") {
      return res
        .status(403)
        .json({ message: "Swap not found or not accepted." });
    }

    const userId = req.user._id.toString();
    const isParticipant = [swap.from.toString(), swap.to.toString()].includes(
      userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const messages = await Message.find({ swapId })
      .sort({ createdAt: 1 })
      .populate("sender", "username");
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch messages." });
  }
};

export const getMyChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const acceptedSwaps = await SwapProposal.find({
      status: "accepted",
      $or: [{ from: userId }, { to: userId }],
    })
      .populate("offeredBook", "title")
      .populate("requestedBook", "title");

    res.json(acceptedSwaps);
  } catch (err) {
    console.error("Error in getMyChats:", err);
    res.status(500).json({ message: "Server error" });
  }
};
