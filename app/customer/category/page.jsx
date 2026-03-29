import CustomerCategoryContent from "./CustomerCategoryContent"
import { getCategoryPageServerData } from "../../lib/serverCatalog"
export const dynamic = "force-dynamic"
export default async function CategoryPage() {
  const { categories, subcategories, maintenanceMessage } =
    await getCategoryPageServerData()

  return (
    <CustomerCategoryContent
      initialCategories={categories}
      initialSubcategories={subcategories}
      maintenanceMessage={maintenanceMessage}
    />
  )
}
