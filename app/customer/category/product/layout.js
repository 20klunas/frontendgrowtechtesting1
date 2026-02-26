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

  const progressPercent = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ================= STICKY STEPPER ================= */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5">

        {/* PROGRESS BAR */}
        <div className="h-[3px] bg-white/10">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* STEPS */}
        <div
          className="
            max-w-7xl mx-auto
            px-3 sm:px-6 lg:px-8
            py-4 sm:py-6

            flex
            items-center
            gap-6 sm:gap-10

            overflow-x-auto
            scrollbar-hide
          "
        >
          {steps.map((label, i) => {
            const active = step === i + 1;
            const done = step > i + 1;

            return (
              <div
                key={i}
                className="
                  flex items-center
                  gap-3 sm:gap-4
                  min-w-fit
                "
              >
                {/* CIRCLE */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{
                    scale: active ? 1.08 : 1,
                    opacity: 1
                  }}
                  transition={{ duration: 0.25 }}
                  className={`
                    flex items-center justify-center
                    w-9 h-9 sm:w-11 sm:h-11
                    rounded-full
                    text-sm sm:text-base font-bold
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

                {/* LABEL */}
                <div className="leading-tight whitespace-nowrap">
                  <div
                    className={`
                      text-[10px] sm:text-xs
                      ${active || done ? "text-green-400" : "text-gray-500"}
                    `}
                  >
                    Langkah {i + 1}
                  </div>

                  <div
                    className={`
                      text-xs sm:text-sm font-semibold
                      ${active ? "text-white" : "text-gray-400"}
                    `}
                  >
                    {label}
                  </div>
                </div>

                {/* CONNECTOR LINE */}
                {i < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0.5, opacity: 0.3 }}
                    animate={{
                      scaleX: step > i + 1 ? 1 : 0.5,
                      opacity: 1
                    }}
                    transition={{ duration: 0.3 }}
                    className={`
                      h-[2px]
                      w-6 sm:w-10 lg:w-14
                      origin-left
                      ${
                        step > i + 1
                          ? "bg-green-500"
                          : "bg-white/20"
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
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </main>
  );
}