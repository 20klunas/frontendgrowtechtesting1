"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Script from "next/script"
import {
  Wallet,
  CreditCard,
  Lock,
  AlertCircle,
} from "lucide-react"
import { authFetch } from "../../../../../../lib/authFetch"
import { clearCheckoutBootstrapCache, getCheckoutBootstrap, readCheckoutBootstrapCache } from "../../../../../../lib/clientBootstrap"
import { notifyCustomerCartChanged } from "../../../../../../lib/customerCartEvents"

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <PaymentPage />
    </Suspense>
  )
}

function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [checkout, setCheckout] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [gateways, setGateways] = useState([])
  const [selectedGateway, setSelectedGateway] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const subtotal = Number(checkout?.summary?.subtotal ?? 0)
  const total = Number(checkout?.summary?.total ?? 0)
  const discount = Number(checkout?.summary?.discount_total ?? 0)

  useEffect(() => {
    if (!searchParams) return

    const orderId = searchParams.get("order_id")
    const status = searchParams.get("transaction_status")

    if (!orderId || !status) return

    const safeOrderId = String(orderId).replace(/[^a-zA-Z0-9-_]/g, "")
    const successStatuses = ["settlement", "capture", "success", "paid"]
    const failedStatuses = ["deny", "cancel", "expire", "failure", "refuse", "failed", "error"]

    if (successStatuses.includes(status)) {
      router.replace(
        `/customer/category/product/detail/lengkapipembelian/methodpayment/success?order=${safeOrderId}`
      )
      return
    }

    if (failedStatuses.includes(status)) {
      router.replace(
        `/customer/category/product/detail/lengkapipembelian/methodpayment/failed?order=${safeOrderId}`
      )
      return
    }

    if (status === "pending") {
      router.replace(
        `/customer/category/product/detail/lengkapipembelian/methodpayment/process?order=${safeOrderId}`
      )
    }
  }, [searchParams, router])

  useEffect(() => {
    let active = true

    const cached = readCheckoutBootstrapCache()

    // 1. SYNC RENDER (NO FLICKER)
    if (cached) {
      setCheckout(cached.checkout)
      setWalletBalance(
        Number(cached.wallet?.wallet?.balance ?? cached.wallet?.balance ?? 0)
      )
      setGateways(cached.gateways || [])

      const firstGateway = (cached.gateways || []).find(
        (row) => String(row?.code || "").toLowerCase() !== "wallet"
      )
      setSelectedGateway(firstGateway?.code || "wallet")

      setLoading(false)
    }

    // 2. BACKGROUND REFRESH
    getCheckoutBootstrap({ force: true }).then((res) => {
      if (!active) return

      const data = res?.data || {}

      setCheckout(data.checkout)
      setWalletBalance(
        Number(data.wallet?.wallet?.balance ?? data.wallet?.balance ?? 0)
      )
      setGateways(data.gateways || [])

      const firstGateway = (data.gateways || []).find(
        (row) => String(row?.code || "").toLowerCase() !== "wallet"
      )
      setSelectedGateway(firstGateway?.code || "wallet")
    })

    return () => {
      active = false
    }
  }, [])

  const visibleGateways = useMemo(
    () => gateways.filter((row) => String(row?.code || "").toLowerCase() !== "wallet"),
    [gateways]
  )

  const insufficientWallet = walletBalance < total
  const checkoutItems = checkout?.items || checkout?.order?.items || []

  const handleCreatePayment = async () => {
    if (!checkout || processing) return

    if (!selectedGateway) {
      alert("Pilih metode pembayaran")
      return
    }

    setProcessing(true)

    try {
      const orderId = checkout?.order?.id
      if (!orderId) throw new Error("Order tidak valid")

      const json = await authFetch(`/api/v1/orders/${orderId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          gateway_code: selectedGateway,
        }),
      })

      if (!json?.success) {
        alert(json?.message || "Payment gagal")
        return
      }

      const payload = json?.data?.payment_payload ?? {}

      if (payload?.snap_token && typeof window !== "undefined" && window?.snap) {
        window.snap.pay(payload.snap_token, {
          onSuccess: function () {
            clearCheckoutBootstrapCache()
            notifyCustomerCartChanged()
            router.push(
              `/customer/category/product/detail/lengkapipembelian/methodpayment/success?order=${orderId}`
            )
          },
          onPending: function () {
            router.push(
              `/customer/category/product/detail/lengkapipembelian/methodpayment/process?order=${orderId}`
            )
          },
          onError: function () {
            router.push(
              `/customer/category/product/detail/lengkapipembelian/methodpayment/failed?order=${orderId}`
            )
          },
          onClose: function () {
            alert("Pembayaran dibatalkan")
          },
        })
        return
      }

      if (payload?.redirect_url) {
        clearCheckoutBootstrapCache()
        window.location.href = payload.redirect_url
        return
      }

      if (selectedGateway === "wallet") {
        clearCheckoutBootstrapCache()
        router.push(
          `/customer/category/product/detail/lengkapipembelian/methodpayment/process?order=${orderId}&method=wallet`
        )
      }
    } catch (err) {
      console.error(err)
      alert(err?.message || "Pembayaran gagal diproses")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading checkout...
      </main>
    )
  }

  if (!checkout || !checkoutItems?.length) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        Checkout kosong
      </main>
    )
  }

  return (
    <main className="bg-black min-h-screen px-4 pb-24 text-white">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Pilih Metode Pembayaran</h1>

        <div className="space-y-3 mb-6">
          {visibleGateways.map((gateway) => (
            <PaymentOption
              key={gateway.code}
              active={selectedGateway === gateway.code}
              onClick={() => setSelectedGateway(gateway.code)}
              icon={<CreditCard />}
              title={gateway.name}
              desc={gateway.description || "Pembayaran online"}
            />
          ))}

          <PaymentOption
            active={selectedGateway === "wallet"}
            onClick={() => setSelectedGateway("wallet")}
            icon={<Wallet />}
            title="Wallet"
            desc={`Saldo tersedia Rp ${walletBalance.toLocaleString("id-ID")}`}
            warning={insufficientWallet}
          />
        </div>

        <div className="border border-purple-500/40 rounded-2xl p-4 flex gap-3 mb-8">
          <AlertCircle size={18} />
          <p className="text-sm text-gray-300">
            Produk digital akan dikirim setelah pembayaran berhasil.
          </p>
        </div>

        <div className="flex gap-4 mb-10">
          <button
            onClick={() => router.back()}
            className="flex-1 border border-purple-500 rounded-xl py-4"
          >
            Kembali
          </button>

          <button
            onClick={handleCreatePayment}
            disabled={processing || (selectedGateway === "wallet" && insufficientWallet)}
            className="flex-1 bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Lock size={18} />
            {processing ? "Memproses..." : "Proses Pembayaran"}
          </button>
        </div>

        <OrderDetail subtotal={subtotal} discount={discount} total={total} />
      </div>
    </main>
  )
}

function PaymentOption({ active, icon, title, desc, warning, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer ${
        active ? "border-purple-500 bg-purple-900/20" : "border-purple-800"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full ${
          active ? "bg-green-400" : "border border-white"
        }`}
      />

      {icon}

      <div>
        <p className="font-semibold">{title}</p>
        <p className={`text-sm ${warning ? "text-red-400" : "text-gray-400"}`}>
          {warning ? "Saldo tidak cukup" : desc}
        </p>
      </div>
    </div>
  )
}

function OrderDetail({ subtotal, discount, total }) {
  return (
    <div className="border border-purple-500/40 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-4">Detail Pesanan</h2>
      <Row label="Sub Total" value={`Rp ${subtotal.toLocaleString("id-ID")}`} />
      <Row label="Diskon" value={`Rp ${discount.toLocaleString("id-ID")}`} />

      <div className="flex justify-between text-xl font-bold text-green-400 mt-4">
        <span>Total Bayar</span>
        <span>Rp {total.toLocaleString("id-ID")}</span>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-gray-300">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
