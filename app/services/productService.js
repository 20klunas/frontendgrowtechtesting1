import { getToken } from "../utils/auth";

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeader = (json = true) => {
  const token = getToken();

  if (!token) throw new Error("Unauthorized - token tidak ada");

  return {
    Authorization: `Bearer ${token}`,
    ...(json && { "Content-Type": "application/json" }),
  };
};

export const productService = {

  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();

    const res = await fetch(`${API}/api/v1/admin/products?${query}`, {
      headers: authHeader(false),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal mengambil produk");
    }

    return res.json();
  },

  async create(payload) {
    const res = await fetch(`${API}/api/v1/admin/products`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal menambah produk");
    }

    return res.json();
  },

  async update(id, payload) {
    const res = await fetch(`${API}/api/v1/admin/products/${id}`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal update produk");
    }

    return res.json();
  },

  async remove(id) {
    const res = await fetch(`${API}/api/v1/admin/products/${id}`, {
      method: "DELETE",
      headers: authHeader(false),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal hapus produk");
    }

    return res.json();
  },

  async publish(id, state) {
    const res = await fetch(`${API}/api/v1/admin/products/${id}/publish`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({
        is_published: state,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal publish produk");
    }

    return res.json();
  },

  async toggleActive(id, currentState) {
    return this.update(id, {
      is_active: !currentState,
    });
  },
};
