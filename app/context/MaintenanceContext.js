"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { publicFetch } from "../lib/publicFetch"
import {
  DEFAULT_MAINTENANCE_STATE,
  normalizeFeatureAccess,
} from "../lib/featureAccess"

const MaintenanceContext = createContext(null)
MaintenanceContext.displayName = "MaintenanceContext"

let accessCache = null
let accessPromise = null

function mergeState(nextState) {
  return {
    ...DEFAULT_MAINTENANCE_STATE,
    ...(nextState || {}),
  }
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

export function MaintenanceProvider({ children, initialState = null }) {
  const mergedInitialState = mergeState(initialState || accessCache)

  const [state, setState] = useState(mergedInitialState)
  const [loading, setLoading] = useState(() => !initialState && !accessCache)

  const applyState = useCallback((nextState) => {
    const merged = mergeState(nextState)
    accessCache = merged
    setState(merged)
  }, [])

  const hydrate = useCallback(
    async ({ force = false } = {}) => {
      try {
        setLoading(true)
        const snapshot = await fetchFeatureAccess(force)
        applyState(snapshot)
        return snapshot
      } catch (err) {
        console.error("Feature access fetch failed:", err)
        applyState(DEFAULT_MAINTENANCE_STATE)
        return DEFAULT_MAINTENANCE_STATE
      } finally {
        setLoading(false)
      }
    },
    [applyState]
  )

  useEffect(() => {
    if (initialState) {
      applyState(initialState)
      setLoading(false)
      return
    }

    if (accessCache) {
      applyState(accessCache)
      setLoading(false)
      return
    }

    hydrate()
  }, [initialState, applyState, hydrate])

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
