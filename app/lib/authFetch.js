import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function authFetch(url, options = {}) {
  const token = Cookies.get("token");

  if (!token) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const defaultHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  // Handle unauthorized
  if (res.status === 401) {
    Cookies.remove("token");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  // Parse JSON
  const data = await res.json();

  // Handle backend error response
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }

  return data; // ⬅ return JSON, bukan Response
}
