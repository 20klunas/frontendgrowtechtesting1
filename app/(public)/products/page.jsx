import ProductsContent from "./ProductsContent"
import { getPublicProductsServerData } from "../../lib/serverCatalog"

export default async function Page({ searchParams }) {
  const params = await searchParams
  const rawSubcategoryId = params?.subcategory_id ?? params?.subcategory ?? null

  const subcategoryId =
    rawSubcategoryId && String(rawSubcategoryId).trim() !== ""
      ? String(rawSubcategoryId).trim()
      : null

  const initialProducts = await getPublicProductsServerData({ subcategoryId })

  return (
    <ProductsContent
      initialProducts={initialProducts}
      initialSubcategoryId={subcategoryId}
    />
  )
}
