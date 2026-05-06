"use client"

const TOAST_EVENT = "growtech:action-toast"

export const ACTION_TOAST_TYPES = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function normalizePath(input) {
  try {
    const url = new URL(String(input), typeof window !== "undefined" ? window.location.origin : "http://localhost")
    return url.pathname.toLowerCase()
  } catch {
    return String(input || "").split("?")[0].toLowerCase()
  }
}

export function isApiMutationToastCandidate(input, init = {}) {
  const method = String(init?.method || "GET").toUpperCase()
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false

  const url = typeof input === "string" ? input : input?.url
  const path = normalizePath(url)

  if (!path.includes("/api/")) return false
  if (path.includes("/webhooks/")) return false
  if (path.includes("/health") || path.includes("/version")) return false

  return true
}

export function extractApiMessage(data) {
  if (!data || typeof data !== "object") return ""

  return (
    data?.message ||
    data?.meta?.message ||
    data?.data?.message ||
    data?.error?.message ||
    data?.errors?.message ||
    ""
  )
}

function getResourceLabel(path) {
  const p = normalizePath(path)

  const labels = [
    [/\/cart\b/, "Keranjang"],
    [/\/favorites\b/, "Favorite/rating produk"],
    [/\/referrals?\b/, "Referral"],
    [/\/withdraws?\b/, "Withdraw referral"],
    [/\/wallet\/topups?\b/, "Top up wallet"],
    [/\/wallet\b/, "Wallet"],
    [/\/orders?\b/, "Order"],
    [/\/payments?\b/, "Pembayaran"],
    [/\/admin\/users?\b/, "User/admin"],
    [/\/admin\/products?\b/, "Produk"],
    [/\/admin\/licenses?\b/, "License"],
    [/\/admin\/categories?\b/, "Kategori"],
    [/\/admin\/subcategories?\b/, "Subkategori"],
    [/\/admin\/banners?\b/, "Banner"],
    [/\/admin\/faqs?\b/, "FAQ"],
    [/\/admin\/pages?\b/, "Halaman konten"],
    [/\/admin\/popups?\b/, "Popup pengumuman"],
    [/\/admin\/settings?\b/, "Konfigurasi"],
    [/\/admin\/referral-settings?\b/, "Pengaturan referral"],
    [/\/admin\/discount-campaigns?\b/, "Diskon campaign"],
    [/\/admin\/vouchers?\b/, "Voucher"],
    [/\/admin\/payment-gateways?\b/, "Payment gateway"],
    [/\/auth\/me\/profile\b/, "Profil"],
    [/\/auth\/me\/avatar\b/, "Avatar"],
    [/\/auth\/password\b/, "Password"],
  ]

  const found = labels.find(([regex]) => regex.test(p))
  if (found) return found[1]

  const parts = p.split("/").filter(Boolean)
  const last = parts[parts.length - 1] || "Data"
  return titleCase(last)
}

export function defaultActionMessage({ url, method, ok = true }) {
  const label = getResourceLabel(url)
  const action = String(method || "GET").toUpperCase()

  if (!ok) {
    if (action === "DELETE") return `${label} gagal dihapus.`
    if (action === "POST") return `${label} gagal disimpan.`
    return `${label} gagal diperbarui.`
  }

  if (action === "DELETE") return `${label} berhasil dihapus.`
  if (action === "POST") return `${label} berhasil disimpan.`
  return `${label} berhasil diperbarui.`
}

export function resolveApiToastMessage({ url, method, ok = true, data = null }) {
  const path = normalizePath(url)
  const action = String(method || "GET").toUpperCase()

  if (path.includes("/cart/buy-now")) {
    return ok
      ? "Produk siap dibeli. Melanjutkan ke checkout."
      : extractApiMessage(data) || "Gagal memproses beli sekarang."
  }

  if (path.includes("/cart/items") && action === "PATCH") {
    return ok
      ? "Jumlah item di keranjang berhasil diperbarui."
      : extractApiMessage(data) || "Gagal memperbarui jumlah item keranjang."
  }

  if (path.includes("/cart/items") && action === "DELETE") {
    return ok
      ? "Item berhasil dihapus dari keranjang."
      : extractApiMessage(data) || "Gagal menghapus item dari keranjang."
  }

  if (path.includes("/favorites") && action === "POST") {
    const serverMessage = extractApiMessage(data)
    if (serverMessage) return serverMessage
    return ok ? "Favorite/rating produk berhasil disimpan." : "Gagal menyimpan favorite/rating produk."
  }

  return extractApiMessage(data) || defaultActionMessage({ url, method: action, ok })
}

export function showGlobalToast(message, type = "success", options = {}) {
  if (typeof window === "undefined") return

  const detail = {
    id: options.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message: String(message || "").trim() || defaultActionMessage({ method: "POST", ok: type !== "error" }),
    type: type || "success",
    duration: Number(options.duration || 3200),
  }

  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }))
}

export function notifyActionSuccess(message, options = {}) {
  showGlobalToast(message, "success", options)
}

export function notifyActionError(message, options = {}) {
  showGlobalToast(message, "error", options)
}

export function notifyActionWarning(message, options = {}) {
  showGlobalToast(message, "warning", options)
}

export function notifyActionInfo(message, options = {}) {
  showGlobalToast(message, "info", options)
}

export { TOAST_EVENT }
