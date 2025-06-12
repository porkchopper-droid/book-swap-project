import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { debugLog } from "../utils/debug.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    debugLog("Before unflag:", user.isFlagged, user.flaggedUntil);

    // Check if user is flagged
    if (user.isFlagged && user.flaggedUntil && user.flaggedUntil > new Date()) {
      return res.status(403).json({
        message:
          "Your account is temporarily restricted due to multiple reports. Please contact support if you believe this is a mistake.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Token error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
