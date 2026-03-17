'use client'

import { WebsiteSettingsProvider } from '../context/WebsiteSettingsContext'
import { CustomerNavbarProvider } from '../context/CustomerNavbarContext'

export default function CustomerProviders({
  children,
  initialBrand = {},
  initialSettings = null,
}) {
  return (
    <WebsiteSettingsProvider
      initialBrand={initialBrand}
      initialSettings={initialSettings}
    >
      <CustomerNavbarProvider>{children}</CustomerNavbarProvider>
    </WebsiteSettingsProvider>
  )
}