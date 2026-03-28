"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { authFetch } from "../lib/authFetch";
import { useAuth } from "../hooks/useAuth";
import { CUSTOMER_CART_REFRESH_EVENT } from "../lib/customerCartEvents";

const CustomerNavbarContext = createContext(null);

const CART_TTL = 15 * 1000;
const LEGACY_CART_REFRESH_EVENT = "cart-updated";

export function CustomerNavbarProvider({
  children,
  initialShellData = null,
}) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const initialCartCount = Number(initialShellData?.nav?.cart_count || 0);

  const [cartLoading, setCartLoading] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [cartItems, setCartItems] = useState([]);

  const lastFetchedAtRef = useRef(0);
  const inflightRef = useRef(null);
  const cartLoadedRef = useRef(false);
  const cartItemsRef = useRef([]);

  const resetCart = useCallback(() => {
    lastFetchedAtRef.current = 0;
    inflightRef.current = null;
    cartLoadedRef.current = false;
    cartItemsRef.current = [];

    setCartLoading(false);
    setCartLoaded(false);
    setCartCount(0);
    setCartItems([]);
  }, []);

  const applyCartData = useCallback((items = []) => {
    const safeItems = Array.isArray(items) ? items : [];
    const total = safeItems.reduce(
      (sum, item) => sum + (Number(item?.qty) || 1),
      0
    );

    cartItemsRef.current = safeItems;
    cartLoadedRef.current = true;
    lastFetchedAtRef.current = Date.now();

    setCartItems(safeItems);
    setCartCount(total);
    setCartLoaded(true);

    return safeItems;
  }, []);

  const fetchCart = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (authLoading) return null;

      if (!userId) {
        resetCart();
        return [];
      }

      const isFresh =
        cartLoadedRef.current &&
        Date.now() - lastFetchedAtRef.current < CART_TTL;

      if (!force && isFresh) {
        return cartItemsRef.current;
      }

      if (inflightRef.current) {
        return inflightRef.current;
      }

      const request = (async () => {
        try {
          if (!silent) {
            setCartLoading(true);
          }

          const json = await authFetch("/api/v1/cart", {
            cache: "no-store",
          });

          if (json?.success) {
            return applyCartData(json?.data?.items || []);
          }

          return applyCartData([]);
        } catch (error) {
          console.error("Failed fetch cart:", error);
          return applyCartData([]);
        } finally {
          setCartLoading(false);
        }
      })();

      inflightRef.current = request.finally(() => {
        if (inflightRef.current === request) {
          inflightRef.current = null;
        }
      });

      return inflightRef.current;
    },
    [authLoading, userId, resetCart, applyCartData]
  );

  const ensureCartLoaded = useCallback(() => {
    return fetchCart({ force: false, silent: false });
  }, [fetchCart]);

  const refreshCart = useCallback(() => {
    return fetchCart({ force: true, silent: true });
  }, [fetchCart]);

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      resetCart();
      return;
    }

    let timeoutId = null;
    let idleId = null;

    const lazyLoadCart = () => {
      fetchCart({ force: false, silent: true });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(lazyLoadCart, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(lazyLoadCart, 300);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      if (idleId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [authLoading, userId, fetchCart, resetCart]);

  useEffect(() => {
    if (!userId) return;
    if (initialCartCount <= 0) return;

    setCartCount((prev) => (prev > 0 ? prev : initialCartCount));
  }, [initialCartCount, userId]);

  useEffect(() => {
    const handleCartRefresh = () => {
      refreshCart();
    };

    const handleVisible = () => {
      if (document.visibilityState !== "visible") return;

      const isStale = Date.now() - lastFetchedAtRef.current >= CART_TTL;
      if (isStale) {
        fetchCart({ force: false, silent: true });
      }
    };

    window.addEventListener(CUSTOMER_CART_REFRESH_EVENT, handleCartRefresh);
    window.addEventListener(LEGACY_CART_REFRESH_EVENT, handleCartRefresh);
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      window.removeEventListener(CUSTOMER_CART_REFRESH_EVENT, handleCartRefresh);
      window.removeEventListener(LEGACY_CART_REFRESH_EVENT, handleCartRefresh);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [fetchCart, refreshCart]);

  const value = useMemo(
    () => ({
      cartLoading,
      cartLoaded,
      cartCount,
      cartItems,
      ensureCartLoaded,
      refreshCart,
    }),
    [
      cartLoading,
      cartLoaded,
      cartCount,
      cartItems,
      ensureCartLoaded,
      refreshCart,
    ]
  );

  return (
    <CustomerNavbarContext.Provider value={value}>
      {children}
    </CustomerNavbarContext.Provider>
  );
}

export function useCustomerNavbar() {
  const context = useContext(CustomerNavbarContext);

  if (!context) {
    throw new Error("useCustomerNavbar must be used inside CustomerNavbarProvider");
  }

  return context;
}