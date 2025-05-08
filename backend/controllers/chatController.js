import Message from "../models/Message.js";
import SwapProposal from "../models/SwapProposal.js";

export const sendMessage = async (req, res) => {
  const { swapId } = req.params;
  const { text } = req.body;

  try {
    const swap = await SwapProposal.findById(swapId);

    if (!swap || swap.status !== "accepted") {
      return res.status(403).json({ message: "Swap not found or not accepted." });
    }

    const userId = req.user._id.toString();
    const isParticipant = [swap.from.toString(), swap.to.toString()].includes(userId);
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not part of this swap." });
    }

    const message = new Message({
      swapId,
      sender: userId,
      text,
    });

    const saved = await message.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not send message." });
  }
};

export const getMessages = async (req, res) => {
    const { swapId } = req.params;
  
    try {
      const swap = await SwapProposal.findById(swapId);
      if (!swap || swap.status !== "accepted") {
        return res.status(403).json({ message: "Swap not found or not accepted." });
      }
  
      const userId = req.user._id.toString();
      const isParticipant = [swap.from.toString(), swap.to.toString()].includes(userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Unauthorized access." });
      }
  
      const messages = await Message.find({ swapId }).sort({ createdAt: 1 });
      res.json(messages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not fetch messages." });
    }
  };
  