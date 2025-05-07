import mongoose from "mongoose";

const swapProposalSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offeredBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    requestedBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    fromAccepted: {
      type: Boolean,
      default: true, // Sender auto-accepts on creation
    },
    toAccepted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    fromMessage: {
      type: String,
      trim: true,
    },
    toMessage: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SwapProposal", swapProposalSchema);
