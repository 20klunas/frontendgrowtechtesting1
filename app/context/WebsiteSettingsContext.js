'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { publicFetch } from '../lib/publicFetch'

const WebsiteSettingsContext = createContext(null)

function parseSettingValue(value) {
  if (typeof value !== 'string') return value

  const trimmed = value.trim()

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return value
    }
  }

  return value
}

function normalizeSettings(rows = []) {
  return rows.reduce((acc, row) => {
    if (!row?.key) return acc
    acc[row.key] = parseSettingValue(row.value)
    return acc
  }, {})
}

export function WebsiteSettingsProvider({
  children,
  initialBrand = {},
  initialSettings = null,
}) {
  const initialResolvedSettings = useMemo(() => {
    return (
      initialSettings || {
        brand: initialBrand || {},
      }
    )
  }, [initialSettings, initialBrand])
  const [settings, setSettings] = useState(initialResolvedSettings)
  const [brand, setBrand] = useState(initialResolvedSettings?.brand || {})
  const [footer, setFooter] = useState(initialResolvedSettings?.footer || {})
  const [loading, setLoading] = useState(
    !initialSettings && !Object.keys(initialBrand || {}).length
  )

  const refreshWebsiteSettings = useCallback(async () => {
    try {
      setLoading(true)

      const res = await publicFetch('/api/v1/content/settings?group=website')
      const normalized = normalizeSettings(res?.data || [])

      setSettings(normalized)
      setBrand(normalized?.brand || {})
      setFooter(normalized?.footer || {})
    } catch (err) {
      if (err?.message !== 'System Maintenance') {
        console.error('Failed fetch website settings:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings)
      setBrand(initialSettings?.brand || {})
      setLoading(false)
      return
    }

    refreshWebsiteSettings()
  }, [initialSettings, refreshWebsiteSettings])

  const value = useMemo(
    () => ({
      settings,
      brand,
      footer,
      loading,
      refreshWebsiteSettings,
    }),
    [settings, brand, footer, loading, refreshWebsiteSettings]
  )

  return (
    <WebsiteSettingsContext.Provider value={value}>
      {children}
    </WebsiteSettingsContext.Provider>
  )
}

export function useWebsiteSettings() {
  const context = useContext(WebsiteSettingsContext)

  if (!context) {
    throw new Error(
      'useWebsiteSettings must be used inside WebsiteSettingsProvider'
    )
  }

  return context
}