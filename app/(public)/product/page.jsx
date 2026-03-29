import ProductBrowserClient from "./ProductBrowserClient"
import { getPublicCategoryBrowserServerData } from "../../lib/serverCatalog"
export const dynamic = "force-dynamic"
export default async function ProductPage() {
  const { categories, subcategories } =
    await getPublicCategoryBrowserServerData()

  return (
    <ProductBrowserClient
      initialCategories={categories}
      initialSubcategories={subcategories}
    />
  )
}
