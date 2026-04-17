"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useCheckoutAccess from "../../../../../hooks/useCheckoutAccess"
import { getCheckoutBootstrap, readCheckoutBootstrapCache } from "../../../../../lib/clientBootstrap"
import { useCustomerNavbar } from "../../../../../context/CustomerNavbarContext"

function resolveProductImage(item) {
  return (
    item?.product?.image_url ||
    item?.product?.image ||
    item?.product?.thumbnail_url ||
    item?.product?.thumbnail ||
    item?.product?.subcategory?.image_url ||
    item?.product?.subcategory?.image ||
    "/logogrowtech.png"
  )
}

export default function StepTwo() {
  const [checkout, setCheckout] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const { loading: accessLoading, allowed, message } = useCheckoutAccess()
  const router = useRouter()
  const { refreshCart: refreshNavbarCart } = useCustomerNavbar()
  useEffect(() => {
    refreshNavbarCart({ force: true }).catch(() => {})
    let active = true;

    const cached = readCheckoutBootstrapCache();
    const cachedCheckout = cached?.checkout || null;
    const cachedWallet = cached?.wallet || null;
    const hasDirectOrderCheckout = Boolean(cachedCheckout?.order?.id);

    if (cachedCheckout) {
      setCheckout(cachedCheckout);
      setWalletBalance(
        Number(cachedWallet?.wallet?.balance ?? cachedWallet?.balance ?? 0)
      );
      setLoading(false);
    }

    if (hasDirectOrderCheckout) {
      return () => {
        active = false;
      };
    }

    getCheckoutBootstrap({ force: !cachedCheckout }).then((json) => {
      if (!active) return;

      const checkoutData = json?.data?.checkout || null;
      const walletData = json?.data?.wallet || null;

      setCheckout(checkoutData);
      setWalletBalance(
        Number(walletData?.wallet?.balance ?? walletData?.balance ?? 0)
      );
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleGoPayment = async () => {
    await getCheckoutBootstrap({ force: true }) // preload
    router.push("/customer/category/product/detail/lengkapipembelian/methodpayment")
  }

  const items = useMemo(() => checkout?.items || checkout?.order?.items || [], [checkout])
  const item = useMemo(() => items?.[0] || null, [items])
  const qty = Number(item?.qty ?? 1)
  const product = item?.product || null
  const unitPrice = Number(item?.unit_price ?? item?.product?.display_price_breakdown?.base_price ?? item?.product?.display_price ?? item?.product?.price ?? 0)
  const productImage = resolveProductImage(item)

  const subtotal = Number(checkout?.summary?.subtotal ?? 0)
  const discount = Number(checkout?.summary?.discount_total ?? 0)
  const taxPercent = Number(checkout?.summary?.tax_percent ?? 0)
  const taxAmount = Number(checkout?.summary?.tax_amount ?? 0)
  const total = Number(checkout?.summary?.total ?? 0)

  if (loading) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-12 text-white animate-pulse">
        <div className="h-8 w-64 bg-purple-900/40 rounded mb-10" />
        <div className="h-40 bg-purple-900/20 rounded-2xl mb-6" />
        <div className="h-20 bg-purple-900/20 rounded-2xl mb-6" />
        <div className="h-12 bg-purple-900/20 rounded-xl mb-6" />
      </section>
    )
  }

  if (!checkout || !items?.length) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-12 text-white text-center">
        <p className="text-gray-400">Checkout kosong</p>

        <Link
          href="/customer/category/product/detail/cart"
          className="mt-4 inline-block px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-600 transition"
        >
          Kembali ke Keranjang
        </Link>
      </section>
    )
  }

  if (accessLoading) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-12 text-white">
        <p className="text-gray-400">Checking checkout access...</p>
      </section>
    )
  }

  if (!allowed) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-12 text-white text-center">
        <h2 className="text-2xl font-semibold mb-3">
          Checkout Sedang Maintenance
        </h2>

        <p className="text-gray-400 mb-6">
          {message || "Silakan coba lagi nanti."}
        </p>

        <Link
          href="/customer/category"
          className="px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-600"
        >
          Kembali ke Katalog
        </Link>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-10">Lengkapi Data Pembelian</h1>

      <div className="rounded-2xl border border-purple-800 bg-black p-6 mb-6">
        <p className="text-sm text-gray-400 mb-4">Produk Yang Dipilih</p>

        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-purple-700">
            <Image
              src={productImage}
              fill
              alt={product?.name || "Produk"}
              className="object-cover"
            />
          </div>

          <div className="flex-1">
            <p className="font-medium">{product?.name}</p>
            <p className="text-sm text-gray-400">
              Rp {unitPrice.toLocaleString("id-ID")} / unit
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-purple-400 font-semibold">
              Rp {(unitPrice * qty).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">Jumlah Pembelian</span>

          <div className="px-4 py-1 rounded-lg bg-purple-900/30">{qty} Unit</div>
        </div>
        <p className="text-xs text-yellow-500 mt-2">
          Catatan: Jumlah pembelian tidak dapat diubah di halaman ini. Untuk
          mengubah jumlah yang dibeli silakan ke keranjang atau masukkan produk ke
          keranjang dahulu.
        </p>
      </div>

      <div className="rounded-2xl border border-purple-800 bg-black p-6 mb-8 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-300">Saldo Wallet</p>
          <p className="text-xs text-gray-500">
            Saldo Tersedia: Rp {walletBalance.toLocaleString("id-ID")}
          </p>
        </div>

        <Link
          href="/customer/topup"
          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-sm"
        >
          Top Up
        </Link>
      </div>

      <div className="flex gap-4 mb-8">
        <Link
          href="/customer/category"
          className="flex-1 text-center py-3 rounded-xl border border-purple-700 hover:bg-purple-700/20"
        >
          Kembali
        </Link>

        <button
          onClick={handleGoPayment}
          className="flex-1 py-3 rounded-xl bg-purple-700 hover:bg-purple-600 font-semibold"
        >
          Lanjut Ke Pembayaran →
        </button>
      </div>

      <div className="rounded-2xl border border-purple-800 bg-black p-6">
        <h3 className="font-semibold mb-4">Ringkasan</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Harga Unit</span>
            <span>Rp {unitPrice.toLocaleString("id-ID")}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Jumlah</span>
            <span>{qty}x</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Sub Total</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Tax ({taxPercent}%)</span>
            <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Diskon</span>
            <span>Rp {discount.toLocaleString("id-ID")}</span>
          </div>

          <div className="border-t border-purple-800 pt-3 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-purple-400">Rp {total.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
