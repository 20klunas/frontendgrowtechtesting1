"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { authFetch } from "../../../../../../../../lib/authFetch"
import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"

function InvoiceContent() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const isPdf = searchParams.get("print") === "pdf"

  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoice()
  }, [])

  const fetchInvoice = async () => {
    try {
      const json = await authFetch(`/api/v1/orders/${id}/delivery`)
      if (json.success) {
        setDelivery(json.data)
      }
    } catch (err) {
      console.error("Invoice fetch error:", err)
    } finally {
      setLoading(false)
      if (isPdf) setTimeout(() => window.print(), 500)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex justify-center px-4 py-16">
        <div className="w-full max-w-2xl animate-pulse space-y-4">
          <div className="h-8 bg-purple-900/40 rounded w-1/2 mx-auto" />
          <div className="h-40 bg-purple-900/20 rounded-2xl" />
        </div>
      </main>
    )
  }

  if (!delivery) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400 font-semibold">Invoice tidak ditemukan</p>
      </main>
    )
  }

  return (
    <main className={`min-h-screen px-4 py-10 ${isPdf ? "bg-white text-black" : "bg-black text-white"}`}>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border border-purple-500/30 rounded-3xl p-8"
        >
          <div className="text-center mb-6">
            <CheckCircle className="mx-auto mb-3 text-green-400" size={48} />
            <h1 className="text-2xl font-bold">Invoice Pesanan Digital</h1>
          </div>

          <div className="space-y-3 text-sm">
            <Row label="Order ID" value={delivery.order_id} />
            <Row label="Invoice" value={delivery.invoice_number || "-"} />
            <Row label="Produk" value={delivery.primary_product_name || "-"} />
            <Row label="Total Qty" value={delivery.total_qty} />
            <Row label="Total Bayar" value={formatCurrency(delivery.total_payable_gateway || delivery.amount)} />
            <Row label="Delivery Mode" value={delivery.delivery_mode} />
            <Row label="Jumlah Delivery" value={delivery.deliveries_count} />
            <Row label="Order Status" value={delivery.order_status} />
            <Row label="Payment Status" value={delivery.payment_status} />
            <Row
              label="Email Delivery"
              value={delivery.emailed ? "Sudah dikirim ke email" : "Belum dikirim"}
            />
          </div>

          <ProductItems items={delivery.items} />

          <div className="mt-8 text-center text-xs text-gray-400">
            Simpan invoice ini sebagai bukti pembelian.
          </div>
        </motion.div>
      </div>

      {isPdf && (
        <style jsx global>{`
          @media print {
            body {
              background: white !important;
            }
            main {
              background: white !important;
              color: black !important;
            }
          }
        `}</style>
      )}
    </main>
  )
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <InvoiceContent />
    </Suspense>
  )
}

function formatCurrency(value) {
  const num = Number(value || 0)
  if (!Number.isFinite(num) || num <= 0) return "-"
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num)
}

function ProductItems({ items }) {
  const rows = Array.isArray(items) ? items.filter(Boolean) : []
  if (!rows.length) return null

  return (
    <div className="mt-6 rounded-2xl border border-purple-500/20 p-4">
      <h2 className="font-semibold mb-3">Rincian Produk</h2>
      <div className="space-y-3">
        {rows.map((item, index) => (
          <div key={`${item?.product_id || index}-${index}`} className="rounded-xl border border-purple-500/20 p-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="font-semibold">{item?.product_name || item?.product?.name || "Produk digital"}</span>
              <span>x{item?.qty || 1}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-400">
              <span>Harga/unit</span>
              <span className="text-right">{formatCurrency(item?.unit_price)}</span>
              <span>Subtotal</span>
              <span className="text-right">{formatCurrency(item?.line_subtotal || Number(item?.unit_price || 0) * Number(item?.qty || 1))}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-purple-500/20 pb-2">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
