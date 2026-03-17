import { getCategoryPageData } from "../../lib/serverCatalogFetch";
import CustomerCategoryContent from "./CustomerCategoryContent";

export default async function CategoryPage() {
  const { categories, subcategories, maintenanceMessage } =
    await getCategoryPageData();

  return (
    <CustomerCategoryContent
      initialCategories={categories}
      initialSubcategories={subcategories}
      maintenanceMessage={maintenanceMessage}
    />
  );
}