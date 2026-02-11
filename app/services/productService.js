import { getToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeader = () => {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const productService = {
  // GET products
  async getAll() {
    const res = await fetch(`${API}/api/v1/admin/products`, {
      headers: authHeader(),
    });
    if (!res.ok) throw new Error("Gagal mengambil produk");
    return res.json();
  },

  // CREATE product
  async create(payload) {
    const res = await fetch(`${API}/api/v1/admin/products`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Gagal menambah produk");
    return res.json();
  },

  // UPDATE product
  async update(id, payload) {
    const res = await fetch(`${API}/api/v1/admin/products/${id}`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Gagal update produk");
    return res.json();
  },

  // DELETE product
  async remove(id) {
    const res = await fetch(`${API}/api/v1/admin/products/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    if (!res.ok) throw new Error("Gagal hapus produk");
    return res.json();
  },

  // PUBLISH product
  async publish(id) {
    const res = await fetch(`${API}/api/v1/admin/products/${id}/publish`, {
      method: "POST",
      headers: authHeader(),
    });
    if (!res.ok) throw new Error("Gagal publish produk");
    return res.json();
  },
};
