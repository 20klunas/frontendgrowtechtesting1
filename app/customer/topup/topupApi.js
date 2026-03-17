const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export function mapGatewayRows(payload) {
  const rows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.items)
    ? payload.data.items
    : [];

  return rows.map((gateway) => ({
    id: gateway.code,
    name: gateway.name,
    desc: "Klik untuk pembayaran",
    fee: gateway.fee_value ?? 0,
    feeType: gateway.fee_type ?? "fixed",
  }));
}

export function mapLedgerRows(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

export function mapWallet(payload) {
  return payload?.data?.wallet ?? null;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchAvailableGateways(init = {}) {
  if (!API) return [];

  try {
    const response = await fetch(
      `${API}/api/v1/payment-gateways/available?scope=topup`,
      {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init.headers || {}),
        },
      }
    );

    const data = await safeJson(response);

    if (!response.ok || !data?.success) return [];

    return mapGatewayRows(data);
  } catch {
    return [];
  }
}

export async function fetchWalletSummary(token, init = {}) {
  if (!API || !token) return null;

  try {
    const response = await fetch(`${API}/api/v1/wallet/summary`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });

    const data = await safeJson(response);

    if (!response.ok || !data?.success) return null;

    return mapWallet(data);
  } catch {
    return null;
  }
}

export async function fetchWalletLedger(token, init = {}) {
  if (!API || !token) return [];

  try {
    const response = await fetch(`${API}/api/v1/wallet/ledger`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });

    const data = await safeJson(response);

    if (!response.ok || !data?.success) return [];

    return mapLedgerRows(data);
  } catch {
    return [];
  }
}

export async function initTopUp(token, { amount, gatewayCode }, init = {}) {
  if (!API || !token) {
    throw new Error("Silakan login ulang");
  }

  const response = await fetch(`${API}/api/v1/wallet/topups/init`, {
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
  });

  const data = await safeJson(response);

  if (!response.ok || !data?.success) {
    throw new Error(data?.error?.message || data?.message || "Topup gagal");
  }

  return data?.data ?? {};
}