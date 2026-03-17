import { getProductPageData } from "../../../lib/serverCatalogFetch";
import CustomerProductContent from "./CustomerProductContent";

function getSingleParam(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}

export default async function Page({ searchParams }) {
  const params = searchParams || {};

  const subcategoryId = getSingleParam(params?.subcategory);
  const sort = getSingleParam(params?.sort) ?? "latest";

  const { products, header, maintenanceMessage } = await getProductPageData({
    subcategoryId,
    sort,
  });

  return (
    <CustomerProductContent
      initialProducts={products}
      initialHeader={header}
      initialSort={sort}
      subcategoryId={subcategoryId}
      maintenanceMessage={maintenanceMessage}
    />
  );
}