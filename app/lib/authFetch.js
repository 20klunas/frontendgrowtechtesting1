import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function authFetch(url, options = {}) {
  const token = Cookies.get("token");

  if (!token) {
    window.location.href = "/login";
    return;
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

  if (res.status === 401) {
    Cookies.remove("token");
    window.location.href = "/login";
    return;
  }

  return res;
}
