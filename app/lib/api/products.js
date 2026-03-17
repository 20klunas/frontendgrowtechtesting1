const API = process.env.NEXT_PUBLIC_API_URL;

/* ================= CATEGORIES ================= */

export async function getCategories() {

  try {

    const res = await fetch(`${API}/api/v1/catalog/categories`, {
      cache: "force-cache",
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const json = await res.json().catch(() => null);

    return json?.success ? json.data || [] : [];

  } catch (err) {

    console.error("Failed fetch categories:", err);
    return [];

  }

}


/* ================= SUBCATEGORIES ================= */

export async function getSubcategories(categoryId = null) {

  try {

    const url = categoryId
      ? `${API}/api/v1/catalog/categories/${categoryId}/subcategories`
      : `${API}/api/v1/catalog/subcategories`;

    const res = await fetch(url, {
      cache: "force-cache",
      next: { revalidate: 120 },
    });

    if (!res.ok) return [];

    const json = await res.json().catch(() => null);

    if (!json?.success) return [];

    return Array.isArray(json.data)
      ? json.data
      : json.data?.data || [];

  } catch (err) {

    console.error("Failed fetch subcategories:", err);
    return [];

  }

}


/* ================= PRODUCTS ================= */

export async function getProducts({
  subcategoryId = null,
  sort = "latest",
  perPage = 100,
}) {

  try {

    let url = `${API}/api/v1/catalog/products?sort=${sort}&per_page=${perPage}`;

    if (subcategoryId) {
      url += `&subcategory_id=${subcategoryId}`;
    }

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const json = await res.json().catch(() => null);

    if (!json?.success) return [];

    return json?.data?.data || [];

  } catch (err) {

    console.error("Failed fetch products:", err);
    return [];

  }

}