import CustomerCategoryContent from "./CustomerCategoryContent"
import { getCategoryPageServerData } from "../../lib/serverCatalog"

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
