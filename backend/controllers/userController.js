import User from "../models/User.js";

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
