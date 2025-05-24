import User from "../models/User.js";

export const getCurrentUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "username email location"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user info" });
  }
};

export const updateUserLocation = async (req, res) => {
  try {
    const { lat, lon } = req.body;
    if (!lat || !lon) {
      return res.status(400).json({ message: "Missing lat/lon." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: "Point",
          coordinates: [lon, lat], // GeoJSON: [lon, lat]
        },
      },
      { new: true }
    );

    res.json({ message: "Location updated", location: user.location });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update location." });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("username email city country location");

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

