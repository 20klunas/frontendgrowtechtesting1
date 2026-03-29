import CustomerProductContent from "./CustomerProductContent"
import { getProductPageServerData } from "../../../lib/serverCatalog"

export const revalidate = 10 // cache 10 detik

export default async function Page(props) {
  const searchParams = await props.searchParams

  const rawSubcategoryId =
    searchParams?.subcategory_id ?? searchParams?.subcategory ?? null

  const subcategoryId =
    rawSubcategoryId && String(rawSubcategoryId).trim() !== ""
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
      key={`subcategory-${subcategoryId ?? "all"}`} // ✅ fix
      initialSubcategoryId={subcategoryId}
      initialProducts={products}
      initialPagination={pagination}
      initialSubcategory={subcategory}
      initialMaintenanceMessage={maintenanceMessage}
    />
  )
}