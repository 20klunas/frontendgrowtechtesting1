import CustomerProductContent from "./CustomerProductContent"
import { getProductPageServerData } from "../../../lib/serverCatalog"

export const revalidate = 0
export const dynamic = "force-dynamic"

export default async function Page(props) {
  const searchParams = await props.searchParams

  const rawSubcategoryId = searchParams?.subcategory_id ?? searchParams?.subcategory ?? null
  const subcategoryId = rawSubcategoryId && String(rawSubcategoryId).trim() !== "" ? String(rawSubcategoryId).trim() : null
  const sort = String(searchParams?.sort || "latest").trim() || "latest"
  const page = Math.max(1, Number(searchParams?.page || 1) || 1)

  const { products, pagination, subcategory, maintenanceMessage } = await getProductPageServerData({
    subcategoryId,
    sort,
    page,
    perPage: 6,
  })

  return (
    <CustomerProductContent
      key={`subcategory-${subcategoryId ?? "all"}-sort-${sort}-page-${page}`}
      initialSubcategoryId={subcategoryId}
      initialSort={sort}
      initialPage={page}
      initialProducts={products}
      initialPagination={pagination}
      initialSubcategory={subcategory}
      initialMaintenanceMessage={maintenanceMessage}
    />
  )
}
