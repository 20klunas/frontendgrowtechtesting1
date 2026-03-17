"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import useCartPage from "../../../../../hooks/useCart";
import CartItem from "../../../../../components/customer/cart/CartItem";
import CartSummary from "../../../../../components/customer/cart/CartSummary";
import VoucherInput from "../../../../../components/customer/cart/VoucherInput";

export default function CartPage() {
  const router = useRouter();

  const {
    items,
    loading,
    unauthorized,
    accessLoading,
    allowed,
    message,

    voucher,
    setVoucher,
    voucherValid,
    previewLoading,

    checkoutLoading,

    subtotal,
    discount,
    total,
    savedAmount,
    baseTotal,

    flip,
    showConfetti,

    updateQty,
    removeItem,
    handleCheckout,
  } = useCartPage(router);

  if (!loading && unauthorized) {
    return <Link href="/login">Login</Link>;
  }

  if (accessLoading) return <p>Loading...</p>;

  if (!allowed) return <p>{message}</p>;

  return (
    <main className="min-h-screen bg-black text-white">
      {showConfetti && <div>🎉</div>}

      <section className="grid lg:grid-cols-3 gap-10">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              updateQty={updateQty}
              removeItem={removeItem}
            />
          ))}
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <VoucherInput
            voucher={voucher}
            setVoucher={setVoucher}
            voucherValid={voucherValid}
            previewLoading={previewLoading}
          />

          <CartSummary
            subtotal={subtotal}
            discount={discount}
            total={total}
            savedAmount={savedAmount}
            baseTotal={baseTotal}
            checkoutLoading={checkoutLoading}
            handleCheckout={handleCheckout}
            flip={flip}
          />
        </div>
      </section>
    </main>
  );
}