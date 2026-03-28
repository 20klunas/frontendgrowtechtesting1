import Link from "next/link";
import { cookies } from "next/headers";
import CartClient from "./CartClient";
import { fetchCartPageData } from "./cartApi";

export const dynamic = "auto";

export default async function CartPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;

  const cartResult = await fetchCartPageData(token, { next: { revalidate: 30 } }); // cache 5 menit

  if (!token || cartResult.unauthorized) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-gray-400 mb-4">
          Kamu harus login untuk melihat keranjang
        </p>

        <Link
          href="/login"
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition"
        >
          Login Sekarang
        </Link>
      </main>
    );
  }

  return (
    <CartClient
      initialItems={cartResult.items}
      initialSummary={cartResult.summary}
    />
  );
}