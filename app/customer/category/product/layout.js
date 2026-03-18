"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function CheckoutLayout({ children }) {
  const pathname = usePathname();

  const getStep = () => {
    if (
      pathname.startsWith(
        "/customer/category/product/detail/lengkapipembelian/methodpayment"
      )
    ) {
      return 3;
    }

    if (pathname.startsWith("/customer/category/product/detail/lengkapipembelian")) {
      return 2;
    }

    return 1;
  };

  const step = getStep();

  const steps = ["Pilih Produk", "Lengkapi Data", "Pembayaran"];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mb-6 sm:mb-10">
        <div
          className="
            mx-auto flex max-w-7xl flex-col items-start justify-start gap-6
            px-4 py-6 sm:flex-row sm:items-center sm:justify-center sm:gap-10
            sm:px-6 sm:py-8 lg:gap-12 lg:px-8
          "
        >
          {steps.map((label, i) => {
            const active = step === i + 1;
            const done = step > i + 1;

            return (
              <div key={i} className="flex gap-3 sm:items-center sm:gap-6">
                <div className="flex flex-col items-center sm:flex-row sm:items-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{
                      scale: active ? 1.05 : 1,
                      opacity: 1,
                    }}
                    transition={{ duration: 0.25 }}
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-full
                      text-sm font-bold transition sm:h-12 sm:w-12 sm:text-lg
                      ${
                        active || done
                          ? "bg-green-500 text-black"
                          : "border-2 border-white text-white"
                      }
                    `}
                  >
                    {i + 1}
                  </motion.div>

                  {i < steps.length - 1 && (
                    <motion.div
                      initial={{ scaleY: 0.6, opacity: 0.5 }}
                      animate={{
                        scaleY: step > i + 1 ? 1 : 0.6,
                        opacity: 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`
                        my-2 h-6 w-[2px] sm:hidden
                        ${step > i + 1 ? "bg-green-500" : "bg-white/40"}
                      `}
                    />
                  )}
                </div>

                <div className="leading-tight">
                  <div
                    className={`text-xs sm:text-sm ${
                      active || done ? "text-green-400" : "text-gray-400"
                    }`}
                  >
                    Langkah {i + 1}
                  </div>

                  <div
                    className={`text-sm font-semibold sm:text-lg ${
                      active ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </div>
                </div>

                {i < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0.6, opacity: 0.5 }}
                    animate={{
                      scaleX: step > i + 1 ? 1 : 0.6,
                      opacity: 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`
                      mx-4 hidden h-[2px] w-12 sm:block lg:w-16
                      ${step > i + 1 ? "bg-green-500" : "bg-white/40"}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}