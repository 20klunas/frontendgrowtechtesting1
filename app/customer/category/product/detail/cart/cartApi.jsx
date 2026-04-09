const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function normalizeCartPayload(payload) {
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    summary: data.summary || {
      subtotal: 0,
      discount_total: 0,
      total: 0,
    },
  };
}

export async function fetchCartPageData(token, init = {}) {
  const defaultResponse = {
    items: [],
    summary: {
      subtotal: 0,
      discount_total: 0,
      total: 0,
    },
    unauthorized: false,
  };

  // 🔒 tidak ada token
  if (!token) {
    return { ...defaultResponse, unauthorized: true };
  }

  // ⚠️ API tidak tersedia
  if (!API) {
    return defaultResponse;
  }

  try {
    const response = await fetch(`${API}/api/v1/cart`, {
      ...init,
      cache: init.cache || "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });

    // 🔐 unauthorized
    if (response.status === 401) {
      return { ...defaultResponse, unauthorized: true };
    }

    const data = await safeJson(response);

    // ❌ response gagal / API error
    if (!response.ok || !data?.success) {
      return defaultResponse;
    }

    const normalized = normalizeCartPayload(data);

    return {
      ...normalized,
      unauthorized: false,
    };
  } catch (error) {
    console.error("fetchCartPageData error:", error);
    return defaultResponse;
  }
}