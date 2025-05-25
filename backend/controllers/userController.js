import User from "../models/User.js";

export const getCurrentUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "username email country city location"
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
    const { username, email, city, country } = req.body;

    // Step 1: Base update object
    const updates = { username, email, city, country };

    // Step 2: If both city & country are present, geocode them
    if (city && country) {

      console.log("Using GeoNames user:", process.env.GEONAMES_USER);

      const response = await fetch(
        `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(
          city
        )}&country=${country}&maxRows=1&username=${process.env.GEONAMES_USER}`
      );

      const data = await response.json();
      const geo = data.geonames?.[0];

      if (geo) {
        updates.location = {
          type: "Point",
          coordinates: [parseFloat(geo.lng), parseFloat(geo.lat)],
        };
      }
    }

    // Step 3: Update user
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("username email city country location");

    res.json(user);

    console.log("Geo request:", `https://secure.geonames.org/searchJSON?q=${city}&country=${country}&maxRows=1&username=${process.env.GEONAMES_USER}`);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

