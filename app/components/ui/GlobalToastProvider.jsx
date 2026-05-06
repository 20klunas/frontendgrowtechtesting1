"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  TOAST_EVENT,
  resolveApiToastMessage,
  isApiMutationToastCandidate,
} from "../../lib/actionToast"

const MAX_VISIBLE_TOASTS = 4

const typeStyle = {
  success: "border-emerald-400/70 bg-emerald-500/15 text-emerald-50 shadow-emerald-950/30",
  error: "border-red-400/70 bg-red-500/15 text-red-50 shadow-red-950/30",
  warning: "border-yellow-400/70 bg-yellow-500/15 text-yellow-50 shadow-yellow-950/30",
  info: "border-sky-400/70 bg-sky-500/15 text-sky-50 shadow-sky-950/30",
}

const typeIcon = {
  success: "✓",
  error: "!",
  warning: "!",
  info: "i",
}

function readSkipToastHeader(input, init = {}) {
  if (init?.skipToast === true || init?.silentToast === true || input?.skipToast === true || input?.silentToast === true) {
    return true
  }

  const headers = new Headers(init?.headers || input?.headers || {})
  return headers.get("x-skip-toast") === "true" || headers.get("x-silent-toast") === "true"
}

async function tryReadJson(response) {
  try {
    const contentType = response?.headers?.get?.("content-type") || ""
    if (!contentType.includes("application/json")) return null
    return await response.clone().json()
  } catch {
    return null
  }
}

export default function GlobalToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const recentRef = useRef({ key: "", at: 0 })
  const timersRef = useRef(new Map())

  const pushToast = useMemo(() => {
    return (payload = {}) => {
      const message = String(payload.message || "").trim()
      if (!message) return

      const type = ["success", "error", "warning", "info"].includes(payload.type)
        ? payload.type
        : "success"
      const now = Date.now()
      const dedupeKey = `${type}:${message}`

      if (recentRef.current.key === dedupeKey && now - recentRef.current.at < 1200) {
        return
      }

      recentRef.current = { key: dedupeKey, at: now }

      const id = payload.id || `${now}-${Math.random().toString(16).slice(2)}`
      const duration = Number(payload.duration || 3200)

      setToasts((prev) => [{ id, type, message }, ...prev].slice(0, MAX_VISIBLE_TOASTS))

      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
        timersRef.current.delete(id)
      }, duration)

      timersRef.current.set(id, timer)
    }
  }, [])

  useEffect(() => {
    const handler = (event) => pushToast(event.detail || {})
    window.addEventListener(TOAST_EVENT, handler)
    return () => window.removeEventListener(TOAST_EVENT, handler)
  }, [pushToast])

  useEffect(() => {
    if (typeof window === "undefined") return undefined
    if (window.__growtechToastFetchPatched) return undefined

    const originalFetch = window.fetch.bind(window)
    window.__growtechToastFetchPatched = true

    window.fetch = async (input, init = {}) => {
      const method = String(init?.method || input?.method || "GET").toUpperCase()
      const url = typeof input === "string" ? input : input?.url || ""
      const shouldToast = isApiMutationToastCandidate(url, { ...init, method }) && !readSkipToastHeader(input, init)

      try {
        const response = await originalFetch(input, init)

        if (shouldToast) {
          const data = await tryReadJson(response)
          const type = response.ok ? "success" : "error"
          const message = resolveApiToastMessage({ url, method, ok: response.ok, data })
          pushToast({ message, type })
        }

        return response
      } catch (error) {
        if (shouldToast) {
          pushToast({
            message: error?.message || resolveApiToastMessage({ url, method, ok: false }),
            type: "error",
          })
        }
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
      window.__growtechToastFetchPatched = false
    }
  }, [pushToast])

  useEffect(() => {
    if (typeof window === "undefined") return undefined
    if (window.__growtechAlertToastPatched) return undefined

    const originalAlert = window.alert.bind(window)
    window.__growtechAlertToastPatched = true

    window.alert = (message) => {
      const text = String(message || "").trim()
      if (!text) return

      const lower = text.toLowerCase()
      const type = lower.includes("gagal") || lower.includes("error") || lower.includes("tidak")
        ? "error"
        : lower.includes("wajib") || lower.includes("minimal") || lower.includes("tunggu") || lower.includes("pilih")
          ? "warning"
          : "success"

      pushToast({ message: text, type })
    }

    return () => {
      window.alert = originalAlert
      window.__growtechAlertToastPatched = false
    }
  }, [pushToast])

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        window.clearTimeout(timer)
      }
      timersRef.current.clear()
    }
  }, [])

  const closeToast = (id) => {
    const timer = timersRef.current.get(id)
    if (timer) window.clearTimeout(timer)
    timersRef.current.delete(id)
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <>
      {children}
      <div className="fixed right-4 top-20 z-[9999] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${typeStyle[toast.type] || typeStyle.success}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/40 text-xs font-bold">
                {typeIcon[toast.type] || "✓"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-5">{toast.message}</div>
              </div>
              <button
                type="button"
                onClick={() => closeToast(toast.id)}
                className="rounded-full px-2 text-lg leading-none opacity-70 hover:opacity-100"
                aria-label="Tutup notifikasi"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
