"use client";

import Image from "next/image";

export default function CartItem({ item, updateQty, removeItem }) {
  const product = item.product;
  const unitPrice = item.unit_price || 0;
  const qty = item.qty || 1;
  const stock = item.stock_available ?? 0;
  const lineSubtotal = item.line_subtotal || 0;

  return (
    <div className="rounded-2xl border border-purple-700 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
      
      <div className="flex items-center gap-4 sm:block">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-blue-600 flex items-center justify-center">
          <Image
            src={product?.subcategory?.image_url || "/placeholder.png"}
            alt={product?.name}
            width={48}
            height={48}
          />
        </div>

        <div className="sm:hidden">
          <h3 className="font-semibold text-sm">{product?.name}</h3>
          <p className="text-xs text-gray-400">
            Rp {unitPrice.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="hidden sm:block font-semibold text-lg">
          {product?.name}
        </h3>

        <p className="hidden sm:block text-sm text-gray-400">
          Rp {unitPrice.toLocaleString()}
        </p>

        <div className="flex items-center gap-3 mt-2">
          <button onClick={() => updateQty(item.id, qty - 1)} disabled={qty <= 1}>−</button>
          <span>{qty}</span>
          <button onClick={() => updateQty(item.id, qty + 1)} disabled={qty >= stock}>+</button>
          <span className="text-xs text-gray-500">Stock: {stock}</span>
        </div>
      </div>

      <div>
        <p>Rp {lineSubtotal.toLocaleString()}</p>
        <button onClick={() => removeItem(item.id)}>Hapus</button>
      </div>
    </div>
  );
}