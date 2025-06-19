import { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import countryList from "react-select-country-list";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./Profile.scss";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-based
  const [year, setYear] = useState(new Date().getFullYear());
  const [dailyBooks, setDailyBooks] = useState([]);
  const [dailySwaps, setDailySwaps] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const countryOptions = countryList().getData();
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    username: profile?.user.username || "",
    email: profile?.user.email || "",
    city: profile?.user.city ? { label: profile.user.city, value: profile.user.city } : null,
    country: profile?.user.country
      ? { label: profile.user.country, value: profile.user.country }
      : null,
    currentPassword: "",
    newPassword: "",
  });

  const [backupForm, setBackupForm] = useState(null);
  const startEditing = () => {
    setBackupForm(form); // snapshot
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setForm(backupForm);
    setIsEditing(false);
    setAvatarFile(null);
  };

  const deleteAccount = async () => {
    if (!window.confirm("This will permanently delete your account, books and swaps. Continue?"))
      return;

    // STEP 1:  Ask for the password (fast fix — replace with a proper modal later)
    const pwd = window.prompt("Please re-enter your password to confirm:");

    if (!pwd) return; // user cancelled

    try {
      await axios.delete("/api/users/account", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        data: { password: pwd },
      });

      // STEP 2:  Logout + redirect
      localStorage.clear();
      window.location.href = "/";
    } catch (err) {
      const { code, error } = err?.response?.data || {};

      if (code === "SWAP_PENDING") {
        alert("⚠️ " + error);
      } else {
        alert(error || "Something went wrong.");
      }
    }
  };

  // When profile loads, set form state
  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.user.username || "",
        email: profile.user.email || "",
        city: profile.user.city ? { label: profile.user.city, value: profile.user.city } : null,
        country: profile.user.country
          ? countryOptions.find((c) => c.value === profile.user.country)
          : null,
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [profile, countryOptions]);

  const loadCityOptions = async (inputValue) => {
    if (!inputValue || !form.country?.value) return [];
    const geoUser = import.meta.env.VITE_GEONAMES_USER;

    try {
      const res = await axios.get(
        `https://secure.geonames.org/searchJSON?q=${inputValue}&country=${form.country.value}&maxRows=5&username=${geoUser}`
      );
      const data = res.data;
      return data.geonames.map((place) => ({
        label: place.name,
        value: place.name,
      }));
    } catch (err) {
      console.warn("🌍 Failed to load city options:", err);
      return [];
    }
  };

  const fillMissingDays = (data, daysInMonth) => {
    const completeData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const entry = data.find((d) => d.day === day);
      completeData.push({ day, count: entry ? entry.count : 0 });
    }
    return completeData;
  };

  // Fetch profile (basic info & lifetime stats)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/account/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch daily books and swaps for the selected month/year
  useEffect(() => {
    const fetchDailyData = async () => {
      try {
        const [booksRes, swapsRes] = await Promise.all([
          axios.get(`/api/users/account/stats/daily-books?month=${month}&year=${year}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          axios.get(`/api/users/account/stats/daily-swaps?month=${month}&year=${year}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
        ]);

        const daysInMonth = new Date(year, month, 0).getDate();
        setDailyBooks(fillMissingDays(booksRes.data.dailyBooks, daysInMonth));
        setDailySwaps(fillMissingDays(swapsRes.data.dailySwaps, daysInMonth));
      } catch (err) {
        console.error("Failed to fetch daily data:", err);
      }
    };
    fetchDailyData();
  }, [month, year]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("city", form.city?.value || "");
      formData.append("country", form.country?.value || "");
      formData.append("currentPassword", form.currentPassword);
      formData.append("newPassword", form.newPassword || "");
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const { data } = await axios.patch(`/api/users/account/profile`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Reset editing mode on successful save!
      setIsEditing(false);

      // Optionally: update profile data with the fresh info
      setProfile((prev) => ({
        ...prev,
        user: { ...prev.user, ...data },
      }));
      alert("Your profile info has been updated successfully! 🎉");
    } catch (err) {
      alert("Failed to update user info. Please double-check your password and fields.");
      console.error(err);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="custom-tooltip">
        <p>Day: {label}</p>
        <p>Count: {payload[0].value}</p>
      </div>
    );
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="profile-layout">
      {/* Left column: Profile info */}
      <aside>
        <div className="profile-info-panel">
          <h3>Edit Your Info</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* Username and avatar upload */}

            <input
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoComplete="username"
              disabled={!isEditing}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files[0])}
              disabled={!isEditing}
            />

            {/* Email */}
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              disabled={!isEditing}
            />

            {/* Country selector */}
            <Select
              classNamePrefix="react-select"
              options={countryOptions}
              value={form.country}
              onChange={(opt) => setForm({ ...form, country: opt })}
              placeholder="Select new country"
              isDisabled={!isEditing}
            />

            {/* City (only if country is selected) */}
            <AsyncSelect
              classNamePrefix="react-select"
              loadOptions={loadCityOptions}
              value={form.city}
              onChange={(val) => setForm({ ...form, city: val })}
              isDisabled={!isEditing || !form.country}
              placeholder="Start typing new city"
            />

            {/* Passwords */}
            <input
              type="password"
              name="currentPassword"
              placeholder="Current Password (required for any change)"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
              disabled={!isEditing}
            />

            <input
              type="password"
              name="newPassword"
              placeholder="New Password (leave blank if no change)"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              disabled={!isEditing}
            />

            {/* Save button */}
            <div className="profile-edit-row">
              {isEditing ? (
                <>
                  <button type="submit">Save</button>
                  <button type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={deleteAccount}
                    title="Irreversible - nukes your data"
                  >
                    Delete My Profile
                  </button>
                </>
              ) : (
                <button type="button" onClick={startEditing}>
                  Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </aside>

      {/* Right column: Graphs */}
      <main>
        <div className="chart-header">
          <button onClick={prevMonth}>⬅️ Previous</button>
          <h3>
            Activity for{" "}
            {new Date(year, month - 1).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button onClick={nextMonth}>Next ➡️</button>
        </div>

        <h4>Books Added Daily</h4>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={dailyBooks}>
            <XAxis dataKey="day" interval={3} tick={{ fontSize: 14, fill: "#CCCC", dy: 5 }} />
            <YAxis
              tickFormatter={(value) => Math.round(value)}
              tick={{ fontSize: 14, fill: "#CCCC", dx: -2 }}
            />
            <CartesianGrid strokeDasharray="1 3" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#FFEB3B"
              dot={{ stroke: "#FFEB3B", strokeWidth: 1, fill: "transparent", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <h4>Swaps Completed Daily</h4>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={dailySwaps}>
            <XAxis dataKey="day" interval={3} tick={{ fontSize: 14, fill: "#CCCC", dy: 5 }} />
            <YAxis
              tickFormatter={(value) => Math.round(value)}
              tick={{ fontSize: 14, fill: "#CCCC", dx: -2 }}
            />
            <CartesianGrid strokeDasharray="1 3" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#FF5733"
              dot={{ stroke: "#FF5733", strokeWidth: 1, fill: "transparent", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </main>
    </div>
  );
}
