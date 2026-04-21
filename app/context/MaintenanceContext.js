"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { publicFetch } from "../lib/publicFetch"
import {
  DEFAULT_MAINTENANCE_STATE,
  normalizeFeatureAccess,
} from "../lib/featureAccess"
import { isAuthRoute } from "../lib/maintenanceHandler"

const MaintenanceContext = createContext(null)
MaintenanceContext.displayName = "MaintenanceContext"

const POLL_INTERVAL_MS = 5000

let accessCache = null
let accessPromise = null

function mergeState(nextState) {
  return {
    ...DEFAULT_MAINTENANCE_STATE,
    ...(nextState || {}),
  }
}

function buildMaintenanceTarget({ key, message, pathname }) {
  const safeNext = encodeURIComponent(pathname || "/")
  const safeMessage = encodeURIComponent(message || "System Maintenance")

  if (key === "public_access") {
    return `/maintenance?scope=public&key=public_access&message=${safeMessage}&next=${safeNext}`
  }

  if (key === "user_auth_access") {
    return `/maintenance?scope=auth&key=user_auth_access&message=${safeMessage}&next=${safeNext}`
  }

  if (key === "user_area_access") {
    return `/maintenance?scope=user&key=user_area_access&message=${safeMessage}&next=${safeNext}`
  }

  return null
}

function resolveActiveRedirect(state, pathname) {
  if (!pathname || pathname.startsWith("/admin")) {
    return null
  }

  if (state?.userAreaDisabled && pathname.startsWith("/customer")) {
    return buildMaintenanceTarget({
      key: "user_area_access",
      message: state.userAreaMessage || "Area user sedang maintenance.",
      pathname,
    })
  }

  if (state?.userAuthDisabled && isAuthRoute(pathname)) {
    return buildMaintenanceTarget({
      key: "user_auth_access",
      message: state.userAuthMessage || "Login dan registrasi sedang maintenance.",
      pathname,
    })
  }

  if (
    state?.publicMaintenance &&
    !pathname.startsWith("/customer") &&
    !pathname.startsWith("/maintenance") &&
    !isAuthRoute(pathname)
  ) {
    return buildMaintenanceTarget({
      key: "public_access",
      message: state.publicMaintenanceMessage || "Halaman publik sedang maintenance.",
      pathname,
    })
  }

  return null
}

async function fetchFeatureAccess(force = false) {
  if (!force && accessCache) {
    return accessCache
  }

  if (!force && accessPromise) {
    return accessPromise
  }

  accessPromise = (async () => {
    const res = await publicFetch("/api/v1/content/feature-access", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
    const normalized = mergeState(normalizeFeatureAccess(res?.data || {}))
    accessCache = normalized
    return normalized
  })()

  try {
    return await accessPromise
  } finally {
    accessPromise = null
  }
}

function getMaintenanceRouteSnapshot() {
  if (typeof window === "undefined") {
    return {
      currentPathWithSearch: "",
      currentKey: "",
      nextPath: "/",
    }
  }

  const currentPathWithSearch = `${window.location.pathname}${window.location.search || ""}`
  const params = new URLSearchParams(window.location.search || "")

  return {
    currentPathWithSearch,
    currentKey: params.get("key") || "",
    nextPath: params.get("next") || "/",
  }
}

export function MaintenanceProvider({ children, initialState = null }) {
  const router = useRouter()
  const pathname = usePathname()
  const isMountedRef = useRef(false)

  const mergedInitialState = mergeState(initialState || accessCache)

  const [state, setState] = useState(mergedInitialState)
  const [loading, setLoading] = useState(() => !initialState && !accessCache)

  const applyState = useCallback((nextState) => {
    const merged = mergeState(nextState)
    accessCache = merged
    setState(merged)
  }, [])

  const hydrate = useCallback(
    async ({ force = false, silent = false } = {}) => {
      try {
        if (!silent) setLoading(true)
        const snapshot = await fetchFeatureAccess(force)
        applyState(snapshot)
        return snapshot
      } catch (err) {
        console.error("Feature access fetch failed:", err)
        applyState(DEFAULT_MAINTENANCE_STATE)
        return DEFAULT_MAINTENANCE_STATE
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [applyState]
  )

  useEffect(() => {
    isMountedRef.current = true

    if (initialState) {
      applyState(initialState)
      setLoading(false)
      hydrate({ force: true, silent: true })
    } else if (accessCache) {
      applyState(accessCache)
      setLoading(false)
      hydrate({ force: true, silent: true })
    } else {
      hydrate()
    }

    return () => {
      isMountedRef.current = false
    }
  }, [initialState, applyState, hydrate])

  useEffect(() => {
    const run = () => hydrate({ force: true, silent: true })

    const intervalId = window.setInterval(run, POLL_INTERVAL_MS)
    const onFocus = () => run()
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        run()
      }
    }
    const onPageShow = () => run()

    window.addEventListener("focus", onFocus)
    window.addEventListener("pageshow", onPageShow)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("pageshow", onPageShow)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [hydrate])

  useEffect(() => {
    if (!isMountedRef.current || !pathname) return

    const activeRedirect = resolveActiveRedirect(state, pathname)
    const { currentPathWithSearch, currentKey, nextPath } = getMaintenanceRouteSnapshot()

    if (!pathname.startsWith("/maintenance")) {
      if (activeRedirect && currentPathWithSearch !== activeRedirect) {
        router.replace(activeRedirect)
      }
      return
    }

    const stillActive =
      (currentKey === "public_access" && state.publicMaintenance) ||
      (currentKey === "user_auth_access" && state.userAuthDisabled) ||
      (currentKey === "user_area_access" && state.userAreaDisabled)

    if (!stillActive) {
      router.replace(nextPath)
    }
  }, [pathname, router, state])

  const refreshMaintenance = useCallback(async () => {
    return hydrate({ force: true })
  }, [hydrate])

  const value = useMemo(
    () => ({
      ...state,
      loading,
      refreshMaintenance,
    }),
    [state, loading, refreshMaintenance]
  )

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  )
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext)

  if (!context) {
    throw new Error("useMaintenance harus dipakai di dalam MaintenanceProvider")
  }

  return context
}
