import { cache } from "react"

export const serverFetch = cache(async (url, options = {}) => {
  const key = url + JSON.stringify(options?.next || {})

  const res = await fetch(url, {
    ...options,
    next: {
      revalidate: 60,
      ...(options.next || {}),
    },
  })

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`)
  }

  return res.json()
})