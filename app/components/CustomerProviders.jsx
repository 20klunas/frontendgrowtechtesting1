"use client"

import { useLayoutEffect, useRef } from "react"
import { CustomerNavbarProvider } from "../context/CustomerNavbarContext"
import { useAuth } from "../hooks/useAuth"

function CustomerAuthHydrator({ initialUser = null }) {
  const { setUser } = useAuth()
  const hasHydrated = useRef(false)

  useLayoutEffect(() => {
    if (hasHydrated.current) return
    if (!initialUser) return

    setUser(initialUser, { display: true })
    hasHydrated.current = true
  }, [initialUser, setUser])

  return null
}

export default function CustomerProviders({ children, initialShellData = null }) {
  return (
    <CustomerNavbarProvider initialShellData={initialShellData}>
      <CustomerAuthHydrator initialUser={initialShellData?.auth?.user || null} />
      {children}
    </CustomerNavbarProvider>
  )
}
