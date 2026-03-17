'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { authFetch } from '../lib/authFetch'
import { useAuth } from '../hooks/useAuth'
import { CUSTOMER_CART_REFRESH_EVENT } from '../lib/customerCartEvents'

const CustomerNavbarContext = createContext(null)

export function CustomerNavbarProvider({ children }) {
  const { user, loading: authLoading } = useAuth()

  const [cartLoading, setCartLoading] = useState(false)
  const [cartLoaded, setCartLoaded] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState([])

  const resetCart = useCallback(() => {
    setCartLoading(false)
    setCartLoaded(false)
    setCartCount(0)
    setCartItems([])
  }, [])

  const applyCartData = useCallback((items = []) => {
    const safeItems = Array.isArray(items) ? items : []
    const total = safeItems.reduce(
      (sum, item) => sum + (Number(item?.qty) || 1),
      0
    )

    setCartItems(safeItems)
    setCartCount(total)
    setCartLoaded(true)
  }, [])

  const fetchCart = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (authLoading) return

      if (!user) {
        resetCart()
        return
      }

      if (cartLoading && !force) return
      if (cartLoaded && !force) return

      try {
        if (!silent) setCartLoading(true)

        const json = await authFetch('/api/v1/cart')

        if (json?.success) {
          applyCartData(json?.data?.items || [])
        } else {
          applyCartData([])
        }
      } catch (error) {
        console.error('Failed fetch cart:', error)
        applyCartData([])
      } finally {
        setCartLoading(false)
      }
    },
    [authLoading, user, cartLoading, cartLoaded, resetCart, applyCartData]
  )

  const ensureCartLoaded = useCallback(() => {
    return fetchCart({ force: false, silent: false })
  }, [fetchCart])

  const refreshCart = useCallback(() => {
    return fetchCart({ force: true, silent: true })
  }, [fetchCart])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      resetCart()
      return
    }

    let timeoutId = null
    let idleId = null

    const lazyLoadCart = () => {
      fetchCart({ force: false, silent: true })
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(lazyLoadCart, { timeout: 1200 })
    } else {
      timeoutId = window.setTimeout(lazyLoadCart, 300)
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      if (idleId && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
    }
  }, [authLoading, user, fetchCart, resetCart])

  useEffect(() => {
    const handleCartRefresh = () => {
      refreshCart()
    }

    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshCart()
      }
    }

    window.addEventListener(CUSTOMER_CART_REFRESH_EVENT, handleCartRefresh)
    document.addEventListener('visibilitychange', handleVisible)

    return () => {
      window.removeEventListener(CUSTOMER_CART_REFRESH_EVENT, handleCartRefresh)
      document.removeEventListener('visibilitychange', handleVisible)
    }
  }, [refreshCart])

  const value = useMemo(
    () => ({
      cartLoading,
      cartLoaded,
      cartCount,
      cartItems,
      ensureCartLoaded,
      refreshCart,
    }),
    [cartLoading, cartLoaded, cartCount, cartItems, ensureCartLoaded, refreshCart]
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
    throw new Error('useCustomerNavbar must be used inside CustomerNavbarProvider')
  }

  return context
}