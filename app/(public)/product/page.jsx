import ProductBrowserClient from "./ProductBrowserClient"
import { getPublicCategoryBrowserServerData } from "../../lib/serverCatalog"

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
