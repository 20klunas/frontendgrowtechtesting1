'use client'

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function CheckoutLayout({ children }) {
  const pathname = usePathname();

  const getStep = () => {
    if (pathname.startsWith("/customer/category/product/detail/lengkapipembelian/methodpayment")) {
      return 3;
    }

    if (pathname.startsWith("/customer/category/product/detail/lengkapipembelian")) {
      return 2;
    }

    return 1;
  };

  const step = getStep();

  const steps = [
    "Pilih Produk",
    "Lengkapi Data",
    "Pembayaran",
  ];

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ================= STEPPER ================= */}
      <div className="mb-6 sm:mb-10">
        <div
          className="
            max-w-7xl mx-auto
            px-4 sm:px-6 lg:px-8
            py-6 sm:py-8

            flex flex-col
            sm:flex-row

            items-start sm:items-center
            justify-start sm:justify-center

            gap-6 sm:gap-10 lg:gap-12
          "
        >
          {steps.map((label, i) => {
            const active = step === i + 1;
            const done = step > i + 1;

            return (
              <div
                key={i}
                className="
                  flex
                  sm:items-center
                  gap-3 sm:gap-6
                "
              >
                {/* MOBILE → STACK VERTICAL */}
                <div className="flex sm:flex-row flex-col items-center sm:items-center">

                  {/* CIRCLE */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{
                      scale: active ? 1.05 : 1,
                      opacity: 1
                    }}
                    transition={{ duration: 0.25 }}
                    className={`
                      flex items-center justify-center
                      w-10 h-10 sm:w-12 sm:h-12
                      rounded-full
                      text-sm sm:text-lg font-bold
                      transition
                      ${
                        active || done
                          ? "bg-green-500 text-black"
                          : "border-2 border-white text-white"
                      }
                    `}
                  >
                    {i + 1}
                  </motion.div>

                  {/* LINE */}
                  {i < steps.length - 1 && (
                    <motion.div
                      initial={{ scaleY: 0.6, opacity: 0.5 }}
                      animate={{
                        scaleY: step > i + 1 ? 1 : 0.6,
                        opacity: 1
                      }}
                      transition={{ duration: 0.3 }}
                      className={`
                        sm:hidden
                        my-2
                        w-[2px] h-6
                        ${
                          step > i + 1
                            ? "bg-green-500"
                            : "bg-white/40"
                        }
                      `}
                    />
                  )}
                </div>

                {/* LABEL */}
                <div className="leading-tight">
                  <div
                    className={`
                      text-xs sm:text-sm
                      ${active || done ? "text-green-400" : "text-gray-400"}
                    `}
                  >
                    Langkah {i + 1}
                  </div>

                  <div
                    className={`
                      text-sm sm:text-lg font-semibold
                      ${active ? "text-white" : "text-gray-400"}
                    `}
                  >
                    {label}
                  </div>
                </div>

                {/* DESKTOP LINE */}
                {i < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0.6, opacity: 0.5 }}
                    animate={{
                      scaleX: step > i + 1 ? 1 : 0.6,
                      opacity: 1
                    }}
                    transition={{ duration: 0.3 }}
                    className={`
                      hidden sm:block
                      mx-4
                      h-[2px] w-12 lg:w-16
                      ${
                        step > i + 1
                          ? "bg-green-500"
                          : "bg-white/40"
                      }
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= PAGE CONTENT ================= */}
      <div className="px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}