import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";

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
      return res.status(400).json({ message: "User already exists" });
    }

    // Default fallback location: Null Island 😅
    let location = { type: "Point", coordinates: [0, 0] };

    // Try to geocode the city & country using GeoNames
    if (city && country) {
      try {
        const url = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(
          city
        )}&country=${country}&maxRows=1&username=${process.env.GEONAMES_USER}`;

        console.log("🌍 Geocoding via GeoNames:", url);

        const geoRes = await fetch(url);
        const geoData = await geoRes.json();
        const geo = geoData.geonames?.[0];

        if (geo) {
          const jitter = () => (Math.random() - 0.5) * 0.02; // jittering users' location on creation
          location = {
            type: "Point",
            coordinates: [
              parseFloat(geo.lng) + jitter(),
              parseFloat(geo.lat) + jitter(),
            ],
          };
        } else {
          console.warn("⚠️ No matching GeoNames result found.");
        }
      } catch (geoErr) {
        console.error("🌐 Geocoding failed:", geoErr);
      }
    }

    // Generate secure random token for verification
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create new user with token & isVerified: false
    const newUser = new User({
      username,
      email,
      password,
      city,
      country,
      location, // 🧭 uses geocoded location
      verificationToken,
      isVerified: false,
    });

    await newUser.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    // Create login token for immediate session (optional)
    // const token = generateToken(newUser._id);

    res.status(201).json({
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
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* -------------------- VERIFY EMAIL -------------------- */
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  console.log(
    "💡 Received verification request for token:",
    token,
    new Date().toISOString()
  );

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      console.log("👀 No user found — maybe already verified or invalid.");
      // return a 200 with a message clarifying
      return res
        .status(200)
        .json({ message: "Email already verified or link expired!" });
    }

    user.isVerified = true;
    user.verificationToken = ""; // clear the token!
    await user.save();

    res.status(200).json({
      message: "Email verified successfully! You can now log in.",
    });
    console.log("✅ User found and verified:", user.email);
  } catch (err) {
    console.error("❌ Email verification failed:", err);
    res.status(500).json({ message: "Server error during verification." });
  }
};

/* ------------------------ LOGIN ----------------------- */

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // And then compare passwords...
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = generateToken(user._id); // generating a token!!!

    // Return user info (without password)
    const { __v, password: _, ...userData } = user._doc;
    res
      .status(200)
      .json({ message: "Login successful", token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login." });
  }
};
