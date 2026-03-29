import ProductsContent from "./ProductsContent"
import { getPublicProductsServerData } from "../../lib/serverCatalog"

export default async function Page({ searchParams }) {
  const { subcategory } = await searchParams

  const subcategoryId =
    subcategory && String(subcategory).trim() !== ""
      ? String(subcategory).trim()
      : null

  const initialProducts = await getPublicProductsServerData({ subcategoryId })

  return (
    <ProductsContent
      initialProducts={initialProducts}
      initialSubcategoryId={subcategoryId}
    />
  )
}