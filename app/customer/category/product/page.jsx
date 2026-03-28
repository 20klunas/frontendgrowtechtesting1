import CustomerProductContent from "./CustomerProductContent"
import { getProductPageServerData } from "../../../lib/serverCatalog"

export default async function Page({ searchParams }) {
  const params = searchParams || {}

  const rawSubcategoryId = params?.subcategory_id ?? params?.subcategory ?? null

  const subcategoryId =
    rawSubcategoryId !== null &&
    rawSubcategoryId !== undefined &&
    String(rawSubcategoryId).trim() !== ""
      ? String(rawSubcategoryId).trim()
      : null

  const { products, pagination, subcategory, maintenanceMessage } =
    await getProductPageServerData({
      subcategoryId,
      sort: "latest",
      page: 1,
      perPage: 6,
    })

  return (
    <CustomerProductContent
      key={`subcategory-${subcategoryId ?? "all"}`}
      initialSubcategoryId={subcategoryId}
      initialProducts={products}
      initialPagination={pagination}
      initialSubcategory={subcategory}
      initialMaintenanceMessage={maintenanceMessage}
    />
  )
}
