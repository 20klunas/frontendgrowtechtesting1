export function filterProducts(subcategories, search, sort) {

  let data = (Array.isArray(subcategories) ? subcategories : []).filter((sub) =>
    (sub.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (sort === "termurah") {
    data = [...data].sort((a, b) => a.price - b.price);
  }

  if (sort === "terlaris") {
    data = [...data].sort((a, b) => b.sold - a.sold);
  }

  if (sort === "terbaru") {
    data = [...data].sort((a, b) => b.id - a.id);
  }

  return data;
}