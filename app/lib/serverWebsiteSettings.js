import { cache } from 'react'
import { buildApiUrl, API_BASE_URL } from './apiUrl'

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

export const getWebsiteSettingsServer = cache(async () => {
  if (!API_BASE_URL) return {}

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(buildApiUrl('/api/v1/content/settings?group=website'), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
      signal: controller.signal,
    })

    if (!res.ok) return {}

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) return {}

    const json = await res.json()
    return normalizeSettings(json?.data || [])
  } catch {
    return {}
  } finally {
    clearTimeout(timeoutId)
  }
})

export async function getWebsiteBrandServer() {
  const settings = await getWebsiteSettingsServer()
  return settings?.brand || {}
}
