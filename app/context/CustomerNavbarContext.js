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

import { fetcher } from "../lib/fetcher"
import { useAuth } from "../hooks/useAuth"
import { CUSTOMER_CART_REFRESH_EVENT } from "../lib/customerCartEvents"

const CustomerNavbarContext = createContext(null)
const CART_TTL = 15 * 1000
const FAVORITE_TTL = 60 * 1000
const FAVORITE_REFRESH_EVENT = "favorite:changed"
const LEGACY_CART_REFRESH_EVENT = "cart-updated"
const AUTH_LOGIN_EVENT = "auth:login"

export function CustomerNavbarProvider({ children, initialShellData = null }) {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null

  const initialCartCount = Number(initialShellData?.nav?.cart_count || 0)
  const initialFavoriteCount = Number(initialShellData?.nav?.favorite_count || 0)

  const [cartLoading, setCartLoading] = useState(false)
  const [cartLoaded, setCartLoaded] = useState(false)
  const [cartCount, setCartCount] = useState(initialCartCount)
  const [cartItems, setCartItems] = useState([])
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount)

  const lastFetchedAtRef = useRef(0)
  const inflightRef = useRef(null)
  const cartLoadedRef = useRef(false)
  const cartItemsRef = useRef([])
  const favoriteFetchedAtRef = useRef(0)
  const favoriteInflightRef = useRef(null)

  const resetAll = useCallback(() => {
    lastFetchedAtRef.current = 0
    inflightRef.current = null
    cartLoadedRef.current = false
    cartItemsRef.current = []
    favoriteFetchedAtRef.current = 0
    favoriteInflightRef.current = null

    setCartLoading(false)
    setCartLoaded(false)
    setCartCount(0)
    setCartItems([])
    setFavoriteCount(0)
  }, [])

  const applyCartData = useCallback((items = []) => {
    const safeItems = Array.isArray(items) ? items : []
    const total = safeItems.reduce((sum, item) => sum + (Number(item?.qty) || 1), 0)

    cartItemsRef.current = safeItems
    cartLoadedRef.current = true
    lastFetchedAtRef.current = Date.now()

    setCartItems(safeItems)
    setCartCount(total)
    setCartLoaded(true)

    return safeItems
  }, [])

  const fetchCart = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (authLoading) return null

      if (!userId) {
        resetAll()
        return []
      }

      const isFresh =
        cartLoadedRef.current &&
        Date.now() - lastFetchedAtRef.current < CART_TTL

      if (!force && isFresh) {
        return cartItemsRef.current
      }

      if (inflightRef.current) {
        return inflightRef.current
      }

      const request = (async () => {
        try {
          if (!silent) {
            setCartLoading(true)
          }

          const json = await fetcher("/api/v1/cart", {}, { auth: true })

          if (json?.success) {
            return applyCartData(json?.data?.items || [])
          }

          return applyCartData([])
        } catch (error) {
          console.error("Failed fetch cart:", error)
          return applyCartData([])
        } finally {
          setCartLoading(false)
        }
      })()

      inflightRef.current = request.finally(() => {
        if (inflightRef.current === request) {
          inflightRef.current = null
        }
      })

      return inflightRef.current
    },
    [authLoading, userId, resetAll, applyCartData]
  )

  const fetchFavoriteCount = useCallback(
    async ({ force = false } = {}) => {
      if (authLoading) return 0

      if (!userId) {
        setFavoriteCount(0)
        favoriteFetchedAtRef.current = 0
        return 0
      }

      const isFresh = Date.now() - favoriteFetchedAtRef.current < FAVORITE_TTL
      if (!force && isFresh) {
        return favoriteCount
      }

      if (favoriteInflightRef.current && !force) {
        return favoriteInflightRef.current
      }

      const request = (async () => {
        try {
          const json = await fetcher("/api/v1/favorites?per_page=1", {}, { auth: true, force })
          const total = Number(json?.data?.total ?? json?.data?.meta?.total ?? 0)
          favoriteFetchedAtRef.current = Date.now()
          setFavoriteCount(total)
          return total
        } catch (error) {
          console.error("Failed fetch favorite count:", error)
          return favoriteCount
        }
      })()

      favoriteInflightRef.current = request.finally(() => {
        if (favoriteInflightRef.current === request) {
          favoriteInflightRef.current = null
        }
      })

      return favoriteInflightRef.current
    },
    [authLoading, userId, favoriteCount]
  )

  const ensureCartLoaded = useCallback(() => {
    return fetchCart({ force: false, silent: false })
  }, [fetchCart])

  const refreshCart = useCallback(() => {
    return fetchCart({ force: true, silent: true })
  }, [fetchCart])

  useEffect(() => {
    if (authLoading) return

    if (!userId) {
      resetAll()
      return
    }

    setCartCount((prev) => (prev > 0 ? prev : initialCartCount))
    setFavoriteCount((prev) => (prev > 0 ? prev : initialFavoriteCount))

    let timeoutId
    let idleId

    fetchCart({ force: true, silent: true }).catch(() => {})

    const preloadFavorites = () => {
      fetchFavoriteCount({ force: true }).catch(() => {})
    }

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(preloadFavorites, { timeout: 800 })
    } else {
      timeoutId = window.setTimeout(preloadFavorites, 400)
    }

    return () => {
      if (typeof window !== "undefined" && typeof window.cancelIdleCallback === "function" && idleId) {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [authLoading, userId, initialCartCount, initialFavoriteCount, resetAll, fetchCart, fetchFavoriteCount])

  useEffect(() => {
    const handleCartRefresh = (event) => {
      const detail = event?.detail || {}
      const actionType = String(detail?.type || "refresh").toLowerCase()

      if (actionType === "add" && detail?.item) {
        const incomingQty = Math.max(1, Number(detail.item.qty) || 1)
        const incomingProductId = Number(detail.item.product_id || detail.item.id || 0)

        if (incomingProductId > 0) {
          const nextItems = [...(cartItemsRef.current || [])]
          const existingIndex = nextItems.findIndex((row) => Number(row?.product_id || row?.id || 0) === incomingProductId)

          if (existingIndex >= 0) {
            const currentQty = Math.max(1, Number(nextItems[existingIndex]?.qty) || 1)
            nextItems[existingIndex] = {
              ...nextItems[existingIndex],
              ...detail.item,
              qty: currentQty + incomingQty,
            }
          } else {
            nextItems.unshift({
              ...detail.item,
              qty: incomingQty,
            })
          }

          applyCartData(nextItems)
        }
      }

      if (actionType === "server-snapshot") {
        if (Array.isArray(detail?.items)) {
          applyCartData(detail.items)
          return
        }
      }

      if (actionType === "update") {
        const itemId = Number(detail?.item_id || 0)
        const qty = Math.max(1, Number(detail?.qty) || 1)

        if (itemId > 0) {
          const nextItems = [...(cartItemsRef.current || [])].map((row) => (
            Number(row?.id || 0) === itemId
              ? {
                  ...row,
                  qty,
                  line_subtotal: Number(row?.unit_price || 0) * qty,
                }
              : row
          ))

          applyCartData(nextItems)
        }
      }

      if (actionType === "remove") {
        const itemId = Number(detail?.item_id || 0)

        if (itemId > 0) {
          const nextItems = [...(cartItemsRef.current || [])].filter(
            (row) => Number(row?.id || 0) !== itemId
          )

          applyCartData(nextItems)
        }
      }

      if (actionType === "reset") {
        applyCartData([])
      }

      if (!detail?.skipServerSync && actionType !== "server-snapshot") {
        refreshCart()
      }
    }

    const handleFavoriteRefresh = (event) => {
      const delta = Number(event?.detail?.delta || 0)

      if (delta !== 0) {
        favoriteFetchedAtRef.current = Date.now()
        setFavoriteCount((prev) => Math.max(0, Number(prev || 0) + delta))
      }

      if (!event?.detail?.skipServerSync) {
        fetchFavoriteCount({ force: true }).catch(() => {})
      }
    }

    const handleVisible = () => {
      if (document.visibilityState !== "visible") return

      if (cartLoadedRef.current) {
        const cartIsStale = Date.now() - lastFetchedAtRef.current >= CART_TTL
        if (cartIsStale) {
          fetchCart({ force: true, silent: true })
        }
      }

      const favoriteIsStale = Date.now() - favoriteFetchedAtRef.current >= FAVORITE_TTL
      if (favoriteIsStale) {
        fetchFavoriteCount({ force: true }).catch(() => {})
      }
    }

    const handleAuthLogin = () => {
      fetchCart({ force: true, silent: true }).catch(() => {})
      fetchFavoriteCount({ force: true }).catch(() => {})
    }

    window.addEventListener(CUSTOMER_CART_REFRESH_EVENT, handleCartRefresh)
    window.addEventListener(LEGACY_CART_REFRESH_EVENT, handleCartRefresh)
    window.addEventListener(FAVORITE_REFRESH_EVENT, handleFavoriteRefresh)
    window.addEventListener(AUTH_LOGIN_EVENT, handleAuthLogin)
    document.addEventListener("visibilitychange", handleVisible)

    return () => {
      window.removeEventListener(CUSTOMER_CART_REFRESH_EVENT, handleCartRefresh)
      window.removeEventListener(LEGACY_CART_REFRESH_EVENT, handleCartRefresh)
      window.removeEventListener(FAVORITE_REFRESH_EVENT, handleFavoriteRefresh)
      window.removeEventListener(AUTH_LOGIN_EVENT, handleAuthLogin)
      document.removeEventListener("visibilitychange", handleVisible)
    }
  }, [applyCartData, fetchCart, refreshCart, fetchFavoriteCount])

  const value = useMemo(
    () => ({
      cartLoading,
      cartLoaded,
      cartCount,
      cartItems,
      favoriteCount,
      ensureCartLoaded,
      refreshCart,
      refreshFavorites: () => fetchFavoriteCount({ force: true }),
    }),
    [cartLoading, cartLoaded, cartCount, cartItems, favoriteCount, ensureCartLoaded, refreshCart, fetchFavoriteCount]
  )

  return (
    <CustomerNavbarContext.Provider value={value}>
      {children}
    </CustomerNavbarContext.Provider>
  )
}

export function useCustomerNavbar() {
  const context = useContext(CustomerNavbarContext)

  if (!context) {
    throw new Error("useCustomerNavbar must be used inside CustomerNavbarProvider")
  }

  return context
}
