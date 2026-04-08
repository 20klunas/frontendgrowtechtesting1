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
    data = JSON.parse(text)
  } catch {
    data = { message: text } // kalau backend kirim HTML/error non-JSON
  }

  if (!res.ok) {
    throw data
  }

  return data
}
