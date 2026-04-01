"use client";

import { useState } from "react";
import { useCustomerNavbar } from "../../../context/CustomerNavbarContext";
import AppTransitionLink from "../../AppTransitionLink";

export default function NavbarCartClient() {
  const [cartOpen, setCartOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { cartCount, cartItems, cartLoading, ensureCartLoaded } = useCustomerNavbar();

  const handleCartOpen = () => {
    setCartOpen(true);

    if (!loaded) {
      ensureCartLoaded();
      setLoaded(true);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleCartOpen}
      onMouseLeave={() => setCartOpen(false)}
    >
      <AppTransitionLink
        href="/customer/category/product/detail/cart"
        transitionMessage="Menyiapkan keranjang Anda..."
        className="relative text-white transition"
      >
        🛒
        {cartCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold">
            {cartCount}
          </span>
        )}
      </AppTransitionLink>

      {cartOpen && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-purple-700/50 bg-[#14002a] p-4 shadow-2xl">
          <h3 className="mb-3 text-sm font-semibold text-white">Keranjang</h3>

          {cartLoading ? (
            <p className="text-sm text-white/60">Memuat keranjang...</p>
          ) : cartItems.length === 0 ? (
            <p className="text-sm text-white/60">Cart kosong</p>
          ) : (
            <div className="max-h-60 space-y-3 overflow-y-auto">
              {cartItems.map((item) => {
                const productName = item?.product?.name || item?.name || "Produk";
                const qty = Number(item?.qty || 0);
                const price = Number(item?.price || item?.unit_price || 0);

                return (
                  <div key={item.id} className="rounded-lg border border-purple-700/30 bg-black/20 p-3">
                    <div className="text-sm font-medium text-white">{productName}</div>
                    <div className="mt-1 text-xs text-white/60">Qty: {qty}</div>
                    <div className="text-xs text-white/60">
                      Harga: {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(price)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
