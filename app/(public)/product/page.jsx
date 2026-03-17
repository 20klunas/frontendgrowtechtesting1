import ProductPageClient from "./ProductPageClient";
import { getCategories, getSubcategories } from "../../lib/api/products";

export default async function ProductPage() {

  const [categories, subcategories] = await Promise.all([
    getCategories(),
    getSubcategories()
  ]);

  return (
    <ProductPageClient
      categories={categories}
      initialSubcategories={subcategories}
    />
  );
}