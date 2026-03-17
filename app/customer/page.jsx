import CustomerHomeClient from "./CustomerHomeClient";
import { publicFetch } from "../lib/publicFetch";
import { authFetch } from "../lib/authFetch";
import {
  getMaintenanceMessage,
  isFeatureMaintenanceError,
} from "../lib/maintenanceHandler";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function CustomerHomePage() {

  let banners = [];
  let popup = null;
  let products = [];
  let catalogMaintenance = "";

  try {

    const [bannerRes, popupRes] = await Promise.all([
      publicFetch("/api/v1/content/banners"),
      publicFetch("/api/v1/content/popup"),
    ]);

    banners = bannerRes?.data || [];
    popup = popupRes?.data?.is_active ? popupRes.data : null;

    try {
      const productRes = await authFetch(
        "/api/v1/catalog/products?sort=popular&per_page=4"
      );

      products = productRes?.data?.data || [];
    } catch (err) {
      if (isFeatureMaintenanceError(err, "catalog_access")) {
        catalogMaintenance = getMaintenanceMessage(
          err,
          "Katalog sedang maintenance."
        );
      }
    }

  } catch (err) {
    console.error(err);
  }

  return (
    <CustomerHomeClient
      banners={banners}
      popup={popup}
      products={products}
      catalogMaintenance={catalogMaintenance}
    />
  );

}