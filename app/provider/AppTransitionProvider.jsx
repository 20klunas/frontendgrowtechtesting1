'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'
import AppTransitionOverlay from '../components/AppTransitionOverlay'

export const AppTransitionContext = createContext(null)

const DEFAULT_MESSAGE = 'Menyiapkan halaman...'
const PATH_SETTLE_DELAY = 450
const FAILSAFE_TIMEOUT = 10000

export function AppTransitionProvider({ children }) {
  const pathname = usePathname()
  const finishTimerRef = useRef(null)
  const failsafeTimerRef = useRef(null)

  const [transition, setTransition] = useState({
    active: false,
    targetPath: null,
    message: DEFAULT_MESSAGE,
  })

  const clearTimers = useCallback(() => {
    if (finishTimerRef.current) {
      window.clearTimeout(finishTimerRef.current)
      finishTimerRef.current = null
    }

    if (failsafeTimerRef.current) {
      window.clearTimeout(failsafeTimerRef.current)
      failsafeTimerRef.current = null
    }
  }, [])

  const finishTransition = useCallback(() => {
    clearTimers()
    setTransition({
      active: false,
      targetPath: null,
      message: DEFAULT_MESSAGE,
    })
  }, [clearTimers])

  const beginTransition = useCallback(
    (targetPath, message = DEFAULT_MESSAGE) => {
      clearTimers()

      setTransition({
        active: true,
        targetPath: targetPath || null,
        message: message || DEFAULT_MESSAGE,
      })

      failsafeTimerRef.current = window.setTimeout(() => {
        finishTransition()
      }, FAILSAFE_TIMEOUT)
    },
    [clearTimers, finishTransition]
  )

  const updateTransitionMessage = useCallback((message) => {
    setTransition((prev) => {
      if (!prev.active) return prev
      return {
        ...prev,
        message: message || prev.message,
      }
    })
  }, [])

  useEffect(() => {
    if (!transition.active || !transition.targetPath) return
    if (pathname !== transition.targetPath) return

    if (finishTimerRef.current) {
      window.clearTimeout(finishTimerRef.current)
    }

    finishTimerRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          finishTransition()
        })
      })
    }, PATH_SETTLE_DELAY)

    return () => {
      if (finishTimerRef.current) {
        window.clearTimeout(finishTimerRef.current)
        finishTimerRef.current = null
      }
    }
  }, [pathname, transition.active, transition.targetPath, finishTransition])

  useEffect(() => {
    if (!transition.active) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [transition.active])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const value = useMemo(
    () => ({
      isTransitioning: transition.active,
      targetPath: transition.targetPath,
      transitionMessage: transition.message,
      beginTransition,
      finishTransition,
      updateTransitionMessage,
    }),
    [
      transition.active,
      transition.targetPath,
      transition.message,
      beginTransition,
      finishTransition,
      updateTransitionMessage,
    ]
  )

  return (
    <AppTransitionContext.Provider value={value}>
      {children}
      <AppTransitionOverlay
        active={transition.active}
        message={transition.message}
      />
    </AppTransitionContext.Provider>
  )
}