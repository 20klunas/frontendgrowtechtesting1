'use client'

import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* ================= TITLE ================= */}
      <div className="max-w-7xl mx-auto px-8 pt-10">
        <h1 className="text-4xl font-bold mb-10">
          Keranjang
        </h1>
      </div>

      {/* ================= CONTENT ================= */}
      <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ================= LEFT : CART ITEMS ================= */}
        <div className="lg:col-span-2 space-y-6">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-purple-700 p-6 flex items-center gap-6"
            >
              {/* IMAGE */}
              <div className="h-20 w-20 rounded-xl bg-blue-600 flex items-center justify-center">
                <Image
                  src="/product/redfinger.png"
                  alt="RedFinger"
                  width={48}
                  height={48}
                />
              </div>

              {/* INFO */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  RedFinger - 1 Bulan
                </h3>
                <p className="text-sm text-gray-400">
                  Rp 50.000 / item
                </p>
                <p className="text-sm text-gray-500">
                  Sisa Stock: 5
                </p>

                {/* QTY */}
                <div className="mt-3 flex items-center gap-2">
                  <button className="h-8 w-8 rounded bg-white text-black font-bold">
                    −
                  </button>
                  <span className="min-w-[32px] text-center">
                    2
                  </span>
                  <button className="h-8 w-8 rounded bg-white text-black font-bold">
                    +
                  </button>
                </div>
              </div>

              {/* PRICE */}
              <div className="text-right space-y-2">
                <p className="text-sm text-gray-400">
                  Harga
                </p>
                <p className="font-semibold">
                  Rp 100.000
                </p>

                <button className="text-gray-400 hover:text-red-500">
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ================= RIGHT : SUMMARY ================= */}
        <div className="rounded-2xl border border-purple-700 p-6 h-fit">

          <h3 className="text-xl font-semibold mb-6">
            Ringkasan
          </h3>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span>Rp 300.000</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Diskon</span>
              <span className="text-red-400">
                -Rp 50.000
              </span>
            </div>

            <div className="border-t border-purple-700 pt-4 flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-purple-400">
                Rp 250.000
              </span>
            </div>
          </div>

          {/* ACTION */}
          <div className="space-y-3">
            <Link
              href="/customer/checkout/detail"
              className="block w-full rounded-xl bg-purple-700 py-3 text-center font-semibold hover:bg-purple-600"
            >
              → Lanjut Checkout
            </Link>

            <Link
              href="/customer/product"
              className="block w-full rounded-xl bg-white py-3 text-center font-semibold text-black"
            >
              Lanjut Belanja
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER DIVIDER ================= */}
      <div className="max-w-7xl mx-auto px-8 mt-16">
        <div className="border-t border-purple-800" />
      </div>

    </main>
  );
}
