import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export async function login(email, password) {
  const res = await axios.post(`${API_URL}/login`, { email, password });
  return res.data;
}

export async function signup(userData) {
  const res = await axios.post(`${API_URL}/register`, userData);
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
