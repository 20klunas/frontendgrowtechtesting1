"use client";

import { useState } from "react";
import Image from "next/image";
import { useCustomerNavbar } from "../../../context/CustomerNavbarContext";
import AppTransitionLink from "../../AppTransitionLink";

export default function NavbarCartClient() {
  const [cartOpen, setCartOpen] = useState(false);

  const {
    cartCount,
    cartItems,
    cartLoading,
    ensureCartLoaded,
  } = useCustomerNavbar();

  const handleCartOpen = () => {
    setCartOpen(true);
    ensureCartLoaded();
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
        <div
          className="
            absolute right-0 top-10 z-50 w-80 rounded-xl border
            border-purple-700/50 bg-[#14002a] p-4 shadow-2xl
          "
        >
          <h3 className="mb-3 text-sm font-semibold text-white">
            Keranjang
          </h3>

          {cartLoading ? (
            <p className="text-sm text-white/60">Memuat keranjang...</p>
          ) : cartItems.length === 0 ? (
            <p className="text-sm text-white/60">Cart kosong</p>
          ) : (
            <div className="max-h-60 space-y-3 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {/* <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-purple-900/30">
                    <Image
                      src={item.product?.image || "/no-image.png"}
                      alt={item.product?.name || "Product"}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div> */}

                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm text-white">
                      {item.product?.name}
                    </p>
                    <p className="text-xs text-purple-300">
                      Qty: {item.qty}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <AppTransitionLink
            href="/customer/category/product/detail/cart"
            transitionMessage="Menyiapkan keranjang Anda..."
            className="
              mt-4 block rounded-lg bg-purple-600 py-2 text-center
              text-sm font-medium text-white transition hover:bg-purple-500
            "
          >
            Lihat Keranjang
          </AppTransitionLink>
        </div>
      )}
    </div>
  );
}