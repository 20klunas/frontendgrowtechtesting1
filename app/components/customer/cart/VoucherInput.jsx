export default function VoucherInput({
  voucher,
  setVoucher,
  voucherValid,
  previewLoading,
}) {
  return (
    <div className="rounded-2xl border border-purple-700 p-6">
      <input
        value={voucher}
        onChange={(e) => setVoucher(e.target.value)}
        placeholder="Kode voucher"
      />

      {voucher && voucherValid === true && <p>✔ Valid</p>}
      {voucher && voucherValid === false && <p>✖ Tidak valid</p>}
    </div>
  );
}