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

const DEFAULT_STATE = {
  publicMaintenance: false,
  publicMaintenanceMessage: "",
  catalogDisabled: false,
  catalogMessage: "",
  checkoutDisabled: false,
  checkoutMessage: "",
  topupDisabled: false,
  topupMessage: "",
  userAuthDisabled: false,
  userAuthMessage: "",
}

const MaintenanceContext = createContext(null)
MaintenanceContext.displayName = "MaintenanceContext"

let accessCache = null
let accessPromise = null

function normalizeFeatureNode(node, fallbackMessage) {
  const enabled = typeof node?.enabled === "boolean" ? node.enabled : true
  const message = typeof node?.message === "string" ? node.message : fallbackMessage

  return {
    disabled: !enabled,
    message: !enabled ? message : "",
  }
}

function normalizeFeatureAccess(payload = {}) {
  const publicAccess = normalizeFeatureNode(
    payload?.public_access,
    "Halaman publik sedang maintenance."
  )
  const catalog = normalizeFeatureNode(
    payload?.catalog_access,
    "Katalog sedang maintenance."
  )
  const checkout = normalizeFeatureNode(
    payload?.checkout_access,
    "Checkout sedang maintenance."
  )
  const topup = normalizeFeatureNode(
    payload?.topup_access,
    "Top up sedang maintenance."
  )
  const userAuth = normalizeFeatureNode(
    payload?.user_auth_access,
    "Login dan registrasi sedang maintenance."
  )

  return {
    publicMaintenance: publicAccess.disabled,
    publicMaintenanceMessage: publicAccess.message,
    catalogDisabled: catalog.disabled,
    catalogMessage: catalog.message,
    checkoutDisabled: checkout.disabled,
    checkoutMessage: checkout.message,
    topupDisabled: topup.disabled,
    topupMessage: topup.message,
    userAuthDisabled: userAuth.disabled,
    userAuthMessage: userAuth.message,
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
    const res = await publicFetch("/api/v1/content/feature-access")
    const normalized = normalizeFeatureAccess(res?.data || {})
    accessCache = normalized
    return normalized
  })()

  try {
    return await accessPromise
  } finally {
    accessPromise = null
  }
}

export function MaintenanceProvider({ children }) {
  const [state, setState] = useState(accessCache || DEFAULT_STATE)
  const [loading, setLoading] = useState(!accessCache)

  const applyState = useCallback((nextState) => {
    setState({
      ...DEFAULT_STATE,
      ...(nextState || {}),
    })
  }, [])

  const hydrate = useCallback(async ({ force = false } = {}) => {
    try {
      setLoading(true)
      const snapshot = await fetchFeatureAccess(force)
      applyState(snapshot)
      return snapshot
    } catch (err) {
      console.error("Feature access fetch failed:", err)
      applyState(DEFAULT_STATE)
      return DEFAULT_STATE
    } finally {
      setLoading(false)
    }
  }, [applyState])

  useEffect(() => {
    hydrate()
  }, [hydrate])

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