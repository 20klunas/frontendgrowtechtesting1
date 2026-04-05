import ProductDetailClient from "./ProductDetailClient";
import { serverFetch } from "../../../../lib/serverFetch";

async function getProduct(productId) {
  if (!productId) return null;

  try {
    const payload = await serverFetch(`/api/v1/products/${productId}`, {
      cache: "no-store",
    });

    return payload?.data || null;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage(props) {
  const searchParams = await props.searchParams;
  const rawId = searchParams?.id ?? null;
  const productId = rawId && String(rawId).trim() !== "" ? String(rawId).trim() : null;
  const initialProduct = await getProduct(productId);

  return <ProductDetailClient productId={productId} initialProduct={initialProduct} />;
}
