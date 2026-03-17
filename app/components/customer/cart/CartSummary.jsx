export default function CartSummary({
  subtotal,
  discount,
  total,
  savedAmount,
  baseTotal,
  checkoutLoading,
  handleCheckout,
  flip,
}) {
  return (
    <div className="rounded-2xl border border-purple-700 p-6">
      <h3>Ringkasan</h3>

      {discount > 0 && (
        <div>
          <span>Sebelum</span>
          <span className="line-through">Rp {baseTotal.toLocaleString()}</span>
        </div>
      )}

      <div>Subtotal: Rp {subtotal.toLocaleString()}</div>
      <div>Diskon: Rp {discount.toLocaleString()}</div>

      <div className={flip ? "flip" : ""}>
        Total: Rp {total.toLocaleString()}
      </div>

      {savedAmount > 0 && <div>Hemat Rp {savedAmount.toLocaleString()}</div>}

      <button onClick={handleCheckout} disabled={checkoutLoading}>
        Checkout
      </button>
    </div>
  );
}