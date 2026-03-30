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

      if (favoriteInflightRef.current) {
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

    const preloadFavorites = () => {
      fetchFavoriteCount({ force: false }).catch(() => {})
    }

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(preloadFavorites, { timeout: 1500 })
    } else {
      timeoutId = window.setTimeout(preloadFavorites, 900)
    }

    return () => {
      if (typeof window !== "undefined" && typeof window.cancelIdleCallback === "function" && idleId) {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [authLoading, userId, initialCartCount, initialFavoriteCount, resetAll, fetchFavoriteCount])

  useEffect(() => {
    const handleCartRefresh = () => {
      refreshCart()
    }

    const handleFavoriteRefresh = () => {
      fetchFavoriteCount({ force: true }).catch(() => {})
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

    window.addEventListener(CUSTOMER_CART_REFRESH_EVENT, handleCartRefresh)
    window.addEventListener(LEGACY_CART_REFRESH_EVENT, handleCartRefresh)
    window.addEventListener(FAVORITE_REFRESH_EVENT, handleFavoriteRefresh)
    document.addEventListener("visibilitychange", handleVisible)

    return () => {
      window.removeEventListener(CUSTOMER_CART_REFRESH_EVENT, handleCartRefresh)
      window.removeEventListener(LEGACY_CART_REFRESH_EVENT, handleCartRefresh)
      window.removeEventListener(FAVORITE_REFRESH_EVENT, handleFavoriteRefresh)
      document.removeEventListener("visibilitychange", handleVisible)
    }
  }, [fetchCart, refreshCart, fetchFavoriteCount])

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
