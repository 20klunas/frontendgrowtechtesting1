import { authFetch } from "../lib/authFetch";

export const licenseService = {

  getByProduct: (productId) =>
    authFetch(`/api/v1/admin/products/${productId}/licenses`),

  getSummary: (productId) =>
    authFetch(`/api/v1/admin/products/${productId}/licenses/summary`),

  createSingle: (productId, data) =>
    authFetch(`/api/v1/admin/products/${productId}/licenses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadBulk: (productId, bulk_text, mode = "skip") =>
    authFetch(`/api/v1/admin/products/${productId}/licenses/upload`, {
      method: "POST",
      body: JSON.stringify({ mode, bulk_text }),
    }),

  checkDuplicates: (product_id, bulk_text) =>
    authFetch(`/api/v1/admin/licenses/check-duplicates`, {
      method: "POST",
      body: JSON.stringify({ product_id, bulk_text }),
    }),

  takeStock: (productId, qty) =>
    authFetch(`/api/v1/admin/products/${productId}/take-stock`, {
      method: "POST",
      body: JSON.stringify({ qty }),
    }),
};
