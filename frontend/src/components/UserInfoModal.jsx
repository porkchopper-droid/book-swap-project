import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import countryList from "react-select-country-list";
import "./UserInfoModal.scss";

const countryOptions = countryList().getData();

export default function UserInfoModal({ user, onClose, onUpdate }) {
  const [avatarFile, setAvatarFile] = useState(null);
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    city: { label: user?.city || "", value: user?.city || "" },
    country: null,
    currentPassword: "", // re-entered for verification
    newPassword: "", // only if they want to change it
  });

  // Hydrate country if stored as ISO code (e.g., "DE")
  useEffect(() => {
    if (!form.country && user?.country) {
      const match = countryOptions.find((opt) => opt.value === user.country);
      if (match) {
        setForm((prev) => ({ ...prev, country: match }));
      }
    }
  }, [user?.country, form.country]);

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

      const { data } = await axios.patch("/api/users/me", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      onUpdate(data);
      onClose();
    } catch (err) {
      alert("Failed to update user info");
      console.error(err);
    }
  };

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div className="user-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Your Info</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="username-file-row">
            <input
              name="username"
              placeholder="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autocomplete="username"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files[0])}
            />
          </div>
          <input
            name="email"
            placeholder="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autocomplete="email"
          />
          <Select
            classNamePrefix="react-select"
            options={countryOptions}
            value={form.country}
            onChange={(opt) => setForm({ ...form, country: opt })}
            placeholder="Select new country"
          />

          <AsyncSelect
            classNamePrefix="react-select"
            loadOptions={loadCityOptions}
            value={form.city}
            onChange={(val) => setForm({ ...form, city: val })}
            isDisabled={!form.country}
            placeholder="Start typing new city"
          />
          <input
            type="password"
            name="currentPassword"
            placeholder="Current Password (required for any change)"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            required
          />

          <input
            type="password"
            name="newPassword"
            placeholder="New Password (leave blank if no change)"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />

          <div className="modal-button">
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
