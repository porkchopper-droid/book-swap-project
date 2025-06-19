import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";
import { debugLog } from "../utils/debug.js";

/* ------------------------- JWT ------------------------ */

// Generate token helper
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/* ----------------------- REGISTER ---------------------- */

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, city, country } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: "EMAIL_TAKEN",
        message: "User already exists",
      });
    }

    // Default fallback location: Null Island 😅
    let location = { type: "Point", coordinates: [0, 0] };

    // Try to geocode the city & country using GeoNames
    if (city && country) {
      try {
        const url = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(
          city
        )}&country=${country}&maxRows=1&username=${process.env.GEONAMES_USER}`;

        debugLog("🌍 Geocoding via GeoNames:", url);

        const geoRes = await fetch(url);
        const geoData = await geoRes.json();
        const geo = geoData.geonames?.[0];

        if (geo) {
          const jitter = () => (Math.random() - 0.5) * 0.02; // jittering users' location on creation
          location = {
            type: "Point",
            coordinates: [parseFloat(geo.lng) + jitter(), parseFloat(geo.lat) + jitter()],
          };
        } else {
          debugLog("⚠️ No matching GeoNames result found.");
        }
      } catch (geoErr) {
        debugLog("🌐 Geocoding failed:", geoErr);
      }
    }

    // Generate secure random token for verification
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create new user with token & isVerified: false
    const newUser = await User.create({
      username,
      email,
      password,
      city,
      country,
      location, // 🧭 uses geocoded location
      verificationToken,
      isVerified: false,
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken, username);

    // Create login token for immediate session (optional)
    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      code: "REGISTER_SUCCESS",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
      message: "Registration successful! Please verify your email.",
    });
  } catch (err) {
    console.error("❌ Registration failed:", err);
    res.status(500).json({
      success: false,
      code: "REGISTER_FAILED",
      message: "Something went wrong",
    });
  }
};

/* -------------------- VERIFY EMAIL -------------------- */
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  debugLog("💡 Received verification request for token:", token, new Date().toISOString());

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      debugLog("👀 No user found — maybe already verified or invalid.");
      return res.status(200).json({
        success: false,
        code: "LINK_EXPIRED_OR_ALREADY_VERIFIED",
        message: "Email already verified or link expired.",
      });
    }

    user.isVerified = true;
    user.verificationToken = ""; // clear the token!
    await user.save();

    debugLog("✅ User found and verified:", user.email);

    return res.status(200).json({
      success: true,
      code: "EMAIL_VERIFIED",
      message: "Email verified successfully! You can now log in.",
    });
  } catch (err) {
    console.error("❌ Email verification failed:", err);
    res.status(500).json({
      success: false,
      code: "VERIFY_FAILED",
      message: "Server error during verification.",
    });
  }
};

/* ------------------------ LOGIN ----------------------- */

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Email and password required.",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found.",
      });
    }

    // And then compare passwords...
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials.",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email first.",
      });
    }

    const token = generateToken(user._id); // generating a token!!!

    // Return user info (without password)
    const { __v, password: _, ...userData } = user._doc;
    res.status(200).json({
      success: true,
      code: "LOGIN_SUCCESS",
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      code: "LOGIN_FAILED",
      message: "Server error during login.",
    });
  }
};
