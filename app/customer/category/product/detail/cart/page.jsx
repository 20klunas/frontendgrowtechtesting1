// app/customer/cart/page.jsx

import CartClient from "./CartClient";
import { cookies } from "next/headers";

export default async function CartPage() {
  const token = cookies().get("token")?.value;

  let initialCart = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      initialCart = await res.json();
    }
  } catch (e) {}

  return <CartClient initialCart={initialCart} />;
}