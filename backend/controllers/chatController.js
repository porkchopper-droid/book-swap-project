import Message from "../models/Message.js";
import SwapProposal from "../models/SwapProposal.js";
import { encryptMessage, decryptMessage } from "../utils/crypto.js";

export const sendMessage = async (req, res) => {
  const { swapId } = req.params;
  const { text } = req.body;

  try {
    const swap = await SwapProposal.findById(swapId);
    const validStatuses = ["accepted", "completed", "reported"];
    if (!swap || !validStatuses.includes(swap.status)) {
      return res.status(403).json({ message: "Swap not found or not accessible." });
    }

    const userId = req.user._id.toString();
    const isParticipant = [swap.from.toString(), swap.to.toString()].includes(userId);
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not part of this swap." });
    }

    const encryptedText = encryptMessage(text);

    const message = new Message({ swapId, sender: userId, text: encryptedText });
    const saved = await message.save();
    const withSender = await saved.populate("sender", "username");

    const decrypted = {
      ...withSender.toObject(),
      text: decryptMessage(withSender.text),
    };

    res.status(201).json(decrypted);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: "Could not send message." });
  }
};

export const getMessages = async (req, res) => {
  const { swapId } = req.params;
  const { before } = req.query;

  try {
    const swap = await SwapProposal.findById(swapId);
    const validStatuses = ["accepted", "completed", "reported"];
    if (!swap || !validStatuses.includes(swap.status)) {
      return res
        .status(403)
        .json({ message: "Swap not found or not accessible." });
    }

    const userId = req.user._id.toString();
    const isParticipant = [swap.from.toString(), swap.to.toString()].includes(
      userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const query = { swapId };
    if (before) {
      // Fetch messages older than the timestamp
      query.createdAt = { $lte: new Date(before) };
    }

    const messages = await Message.find(query)
  .sort({ createdAt: -1 })
  .limit(20)
  .populate("sender", "username profilePicture");

const decryptedMessages = messages.map((msg) => ({
  ...msg.toObject(),
  text: decryptMessage(msg.text) || "[Unable to decrypt message]",
}));

res.json(decryptedMessages);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ message: "Could not fetch messages." });
  }
};

export const getMyChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const acceptedSwaps = await SwapProposal.find({
      status: { $in: ["accepted", "completed", "reported"] },
      $or: [
        { from: userId, fromArchived: false },
        { to: userId, toArchived: false },
      ],
    })
      .populate("from", "username profilePicture") // name and avatar
      .populate("to", "username profilePicture") // name and avatar
      .populate("offeredBook", "title") // book title
      .populate("requestedBook", "title"); // book title

    res.json(acceptedSwaps);
  } catch (err) {
    console.error("Error in getMyChats:", err);
    res.status(500).json({ message: "Server error" });
  }
};
