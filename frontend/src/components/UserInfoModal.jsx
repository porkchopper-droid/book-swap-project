import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import countryList from "react-select-country-list";
import "./UserInfoModal.scss";

const countryOptions = countryList().getData();

export default function UserInfoModal({ user, onClose, onUpdate }) {
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    city: { label: user?.city || "", value: user?.city || "" },
    country: null,
  });

  // Hydrate country if stored as ISO code (e.g., "DE")
  useEffect(() => {
    if (!form.country && user?.country) {
      const match = countryOptions.find(opt => opt.value === user.country);
      if (match) {
        setForm(prev => ({ ...prev, country: match }));
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
      const payload = {
        username: form.username,
        email: form.email,
        city: form.city?.value || "",
        country: form.country?.value || "",
      };

      const { data } = await axios.patch("/api/users/me", payload, {
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Your Info</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {["username", "email"].map((field) => (
            <input
              key={field}
              name={field}
              placeholder={field}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required
            />
          ))}

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

          <div className="modal-buttons">
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
