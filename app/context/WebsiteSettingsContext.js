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

let websiteSettingsCache = null
let websiteSettingsPromise = null

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

async function fetchWebsiteSettingsShared(force = false) {
  if (!force && websiteSettingsCache) {
    return websiteSettingsCache
  }

  if (!force && websiteSettingsPromise) {
    return websiteSettingsPromise
  }

  websiteSettingsPromise = (async () => {
    const res = await publicFetch('/api/v1/content/settings?group=website')
    const normalized = normalizeSettings(res?.data || [])
    websiteSettingsCache = normalized
    return normalized
  })()

  try {
    return await websiteSettingsPromise
  } finally {
    websiteSettingsPromise = null
  }
}

export function WebsiteSettingsProvider({
  children,
  initialBrand = {},
  initialSettings = null,
}) {
  const resolvedInitialSettings = useMemo(() => {
    if (initialSettings && Object.keys(initialSettings).length) {
      return initialSettings
    }

    if (websiteSettingsCache && Object.keys(websiteSettingsCache).length) {
      return websiteSettingsCache
    }

    return {
      brand: initialBrand || {},
    }
  }, [initialSettings, initialBrand])

  const [settings, setSettings] = useState(resolvedInitialSettings)
  const [brand, setBrand] = useState(resolvedInitialSettings?.brand || {})
  const [footer, setFooter] = useState(resolvedInitialSettings?.footer || {})
  const [loading, setLoading] = useState(
    !initialSettings && !websiteSettingsCache && !Object.keys(initialBrand || {}).length
  )

  const applySettings = useCallback((nextSettings) => {
    const normalized = nextSettings || {}
    setSettings(normalized)
    setBrand(normalized?.brand || {})
    setFooter(normalized?.footer || {})
  }, [])

  const refreshWebsiteSettings = useCallback(async ({ force = false } = {}) => {
    try {
      setLoading(true)
      const normalized = await fetchWebsiteSettingsShared(force)
      applySettings(normalized)
      return normalized
    } catch (err) {
      if (err?.message !== 'System Maintenance') {
        console.error('Failed fetch website settings:', err)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [applySettings])

  useEffect(() => {
    if (initialSettings && Object.keys(initialSettings).length) {
      websiteSettingsCache = initialSettings
      applySettings(initialSettings)
      setLoading(false)
      return
    }

    if (websiteSettingsCache && Object.keys(websiteSettingsCache).length) {
      applySettings(websiteSettingsCache)
      setLoading(false)
      return
    }

    refreshWebsiteSettings()
  }, [initialSettings, applySettings, refreshWebsiteSettings])

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
    throw new Error('useWebsiteSettings must be used inside WebsiteSettingsProvider')
  }

  return context
}