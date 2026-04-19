import { buildApiUrl, API_BASE_URL } from "../../lib/apiUrl"

const GATEWAY_TTL = 5 * 60 * 1000

let gatewayCache = null
let gatewayCacheExpiry = 0
let gatewayPromise = null

export function mapGatewayRows(payload) {
  const rows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.items)
    ? payload.data.items
    : []

  return rows.map((gateway) => ({
    id: gateway.code,
    name: gateway.name,
    desc: "Klik untuk pembayaran",
    fee: gateway.fee_value ?? 0,
    feeType: gateway.fee_type ?? "fixed",
  }))
}

export function mapLedgerRows(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

export function mapWallet(payload) {
  return payload?.data?.wallet ?? null
}

export function mapTopupRows(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function canUseGatewayMemoryCache() {
  return gatewayCache && gatewayCacheExpiry > Date.now()
}

export async function fetchAvailableGateways(options = {}) {
  const { revalidate = 300, force = false, headers = {}, ...rest } = options

  if (!API_BASE_URL) return []

  if (!force && canUseGatewayMemoryCache()) {
    return gatewayCache
  }

  if (!force && gatewayPromise) {
    return gatewayPromise
  }

  gatewayPromise = (async () => {
    try {
      const response = await fetch(
        buildApiUrl("/api/v1/payment-gateways/available?scope=topup"),
        {
          ...rest,
          headers: {
            Accept: "application/json",
            ...headers,
          },
          cache: "force-cache",
          next: { revalidate },
        }
      )

      const data = await safeJson(response)

      if (!response.ok || !data?.success) return []

      gatewayCache = mapGatewayRows(data)
      gatewayCacheExpiry = Date.now() + GATEWAY_TTL
      return gatewayCache
    } catch {
      return []
    } finally {
      gatewayPromise = null
    }
  })()

  return gatewayPromise
}

export async function fetchWalletSummary(token, init = {}) {
  if (!API_BASE_URL || !token) return null

  try {
    const response = await fetch(buildApiUrl("/api/v1/wallet/summary"), {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
    })

    const data = await safeJson(response)

    if (!response.ok || !data?.success) return null

    return mapWallet(data)
  } catch {
    return null
  }
}

export async function fetchWalletLedger(token, init = {}) {
  if (!API_BASE_URL || !token) return []

  try {
    const response = await fetch(buildApiUrl("/api/v1/wallet/ledger"), {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
    })

    const data = await safeJson(response)

    if (!response.ok || !data?.success) return []

    return mapLedgerRows(data)
  } catch {
    return []
  }
}

export async function initTopUp(token, { amount, gatewayCode }, init = {}) {
  if (!API_BASE_URL || !token) {
    throw new Error("Silakan login ulang")
  }

  const response = await fetch(buildApiUrl("/api/v1/wallet/topups/init"), {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    body: JSON.stringify({
      amount,
      gateway_code: gatewayCode,
    }),
    cache: "no-store",
  })

  const data = await safeJson(response)

  if (!response.ok || !data?.success) {
    throw new Error(data?.error?.message || data?.message || "Topup gagal")
  }

  return data?.data ?? {}
}


export async function fetchWalletTopupHistory(token, init = {}) {
  if (!API_BASE_URL || !token) return []

  try {
    const response = await fetch(buildApiUrl('/api/v1/wallet/topups'), {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
      cache: 'no-store',
    })

    const data = await safeJson(response)
    if (!response.ok || !data?.success) return []
    return mapTopupRows(data)
  } catch {
    return []
  }
}
