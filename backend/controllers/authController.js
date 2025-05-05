import User from "../models/User.js";
import jwt from "jsonwebtoken";

/* ------------------------- JWT ------------------------ */

// Generate token helper
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/* ----------------------- SIGN UP ---------------------- */

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, city, country } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create and save the new user
    const newUser = new User({ username, email, password, city, country });
    await newUser.save();
    res.status(201).json({ message: "User created", userId: newUser._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
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

    const token = generateToken(user._id); // generating a token

    // Return user info (without password)
    const { __v, password: _, ...userData } = user._doc;
    res.status(200).json({ message: "Login successful", token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login." });
  }
};