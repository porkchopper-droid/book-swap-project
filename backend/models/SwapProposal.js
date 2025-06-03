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
      enum: [
        "pending",
        "accepted",
        "declined",
        "completed",
        "expired",
        "reported",
        "cancelled",
      ],
      default: "pending",
    },
    fromCompleted: {
      type: Boolean,
      default: false,
    },
    toCompleted: {
      type: Boolean,
      default: false,
    },
    fromArchived: {
      type: Boolean,
      default: false,
    },
    toArchived: {
      type: Boolean,
      default: false,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    expiredAt: {
      type: Date,
      default: null,
    },
    reportedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
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
  { timestamps: true } // createdAt
);

export default mongoose.model("SwapProposal", swapProposalSchema);
