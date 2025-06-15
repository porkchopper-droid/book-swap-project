import mongoose from "mongoose";

const userTombstoneSchema = new mongoose.Schema({
  originalUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deletedAt: {
    type: Date,
    default: Date.now,
  },
  username: String,
  email: String,
  country: String,
  city: String,
  profilePicture: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  stats: {
    booksCount: Number,
    totalSwaps: Number,
    lastSwapDate: Date,
  },
  legacyBooks: [
    {
      title: String,
      author: String,
      year: Number,
      genre: String,
    },
  ],
  legacyMessages: [
    {
      swapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SwapProposal",
      },
      text: String,
      createdAt: Date,
    },
  ],
  reason: {
    type: String,
    default: "User deleted account",
  },
});

userTombstoneSchema.index({ location: "2dsphere" });

const UserTombstone = mongoose.model("UserTombstone", userTombstoneSchema);
export default UserTombstone;
