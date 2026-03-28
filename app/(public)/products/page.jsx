import ProductsContent from "./ProductsContent"
import { getPublicProductsServerData } from "../../lib/serverCatalog"

export default async function Page({ searchParams }) {
  const params = searchParams || {}
  const rawSubcategoryId = params?.subcategory ?? null
  const subcategoryId =
    rawSubcategoryId !== null &&
    rawSubcategoryId !== undefined &&
    String(rawSubcategoryId).trim() !== ""
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
