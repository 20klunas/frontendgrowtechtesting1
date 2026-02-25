"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { authFetch } from "../../../../../../../../lib/authFetch";

export default function InvoicePage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isPdf = searchParams.get("print") === "pdf";

  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {
    try {
      const [paymentJson, deliveryJson] = await Promise.all([
        authFetch(`/api/v1/orders/${id}/payments`),
        authFetch(`/api/v1/orders/${id}/delivery`),
      ]);

      if (paymentJson.success) {
        setOrder(paymentJson.data.order);   // ✅ ambil order dari payments
      }

      if (deliveryJson.success) {
        setDelivery(deliveryJson.data);
      }
    } catch (err) {
      console.error("Invoice fetch error:", err);
    } finally {
      setLoading(false);
      if (isPdf) triggerPrint();
    }
  };

  const triggerPrint = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (loading) return <div className="p-10">Memuat invoice...</div>;

  return (
    <main className={isPdf ? "bg-white text-black" : "bg-black text-white"}>
      <div className="max-w-2xl mx-auto p-10">

        {/* CARD */}
        <div className="border rounded-2xl p-8 shadow-sm">

          {/* HEADER */}
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">📦</div>
            <h1 className="text-2xl font-bold">
              Pesanan Digital Kamu
            </h1>
            <p className="text-sm text-gray-500">
              Terima kasih atas pembelianmu. Berikut detail pesanan digitalmu.
            </p>
          </div>

          {/* INVOICE */}
          <div className="flex justify-center mb-6">
            <div className="px-4 py-1 border rounded-full text-sm">
              Invoice : <strong>{order?.invoice_number ?? "-"}</strong>
              
            </div>
          </div>

          {/* DETAIL */}
          <div className="border rounded-xl p-4 mb-6">
            <Row label="Produk">
              {delivery?.product_name || "Produk Digital"}
            </Row>

            <Row label="Qty">
              {delivery?.qty}
            </Row>

            <Row label="License Key">
              <div className="mt-2 border rounded-lg p-3 font-mono bg-gray-50">
                {delivery?.license_key || "••••••••••"}
              </div>
            </Row>
          </div>

          {/* FOOTER */}
          <div className="text-center text-sm text-gray-500">
            <p className="mb-1 font-medium">
              Terima kasih atas kepercayaanmu!
            </p>
            <p>
              Simpan email ini sebagai bukti pembelian. Jika ada kendala,
              jangan ragu untuk menghubungi kami.
            </p>
          </div>
        </div>
      </div>

      {/* PRINT STYLE */}
      {isPdf && <PrintStyle />}
    </main>
  );
}

function Row({ label, children }) {
  return (
    <div className="mb-3">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function PrintStyle() {
  return (
    <style jsx global>{`
      @media print {
        body {
          background: white;
        }
        main {
          background: white !important;
          color: black !important;
        }
      }
    `}</style>
  );
}

if (!order) {
  return (
    <div className="p-10 text-center text-red-400">
      Invoice tidak ditemukan
    </div>
  );
}