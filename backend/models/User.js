import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePicture: {
      type: String, // URL to their profile picture (optional LATER)
      default: "",
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: "",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0],
      },
    },
    manualLocation: {
      type: Boolean,
      default: false,
    },
    reportedCount: {
      type: Number,
      default: 0,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    manualLocation: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* -------------- Location Index Definition ------------- */
userSchema.index({ location: "2dsphere" });

/* ----------- Password Hashing Before Saving ----------- */
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // passes error to Mongoose
  }
});

/* ----------- Method to Compare Passwords ----------- */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ----------- Model Export ----------- */
export default mongoose.model("User", userSchema); // Mongoose created >> users (seen in MongoDB)
