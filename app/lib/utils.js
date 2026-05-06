import Cookies from "js-cookie"

export function cn(...classes) {
  return classes
    .flatMap((cls) => {
      if (!cls) return []
      if (typeof cls === "string") return cls
      if (typeof cls === "object")
        return Object.entries(cls)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
      return []
    })
    .join(" ")
}

export async function apiFetch(url, options = {}) {
  const token = Cookies.get("token")

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${url}`,
    {
      ...options,
      cache: "no-store",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }
  )

  let data
  const text = await res.text()

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }

  if (!res.ok) {
    const message = data?.error?.message || data?.message || `HTTP ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    error.details = data?.error?.details ?? data?.errors ?? null
    throw error
  }

  return data
}
