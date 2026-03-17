import { Suspense } from "react";
import { getProductPageData } from "../../../lib/serverCatalogFetch";
import CustomerProductContent from "./CustomerProductContent";

export default async function Page({ searchParams }) {
  const params = searchParams || {};

  const subcategoryId = getSingleParam(params?.subcategory);
  const sort = getSingleParam(params?.sort) ?? "latest";

  const { products, header, maintenanceMessage } = await getProductPageData({
    subcategoryId,
    sort,
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerProductContent
        initialProducts={products}
        initialHeader={header}
        initialSort={sort}
        subcategoryId={subcategoryId}
        maintenanceMessage={maintenanceMessage}
      />
    </Suspense>
  );
}