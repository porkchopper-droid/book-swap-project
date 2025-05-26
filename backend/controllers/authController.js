import User from "../models/User.js";
import jwt from "jsonwebtoken";

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

    const newUser = new User({
      username,
      email,
      password,
      city,
      country,
      location, // 🧭 uses geocoded location
    });

    await newUser.save();

    const token = generateToken(newUser._id);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("❌ Registration failed:", err);
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
