import axios from "axios";

export async function login(email, password) {
  const res = await axios.post(`/api/auth/login`, { email, password });
  return res.data;
}

export async function signup(userData) {
  const res = await axios.post(`/api/auth/register`, userData);
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
