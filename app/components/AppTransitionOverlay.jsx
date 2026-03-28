'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'

export default function AppTransitionOverlay({ active, message }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="app-transition-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/88 backdrop-blur-md"
        >
          <div className="mx-4 w-full max-w-md rounded-3xl border border-purple-500/40 bg-[#090011]/95 p-8 text-center shadow-[0_0_60px_rgba(168,85,247,0.18)]">
            <motion.div
              initial={{ scale: 0.94, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                repeat: Infinity,
                repeatType: 'reverse',
                duration: 0.9,
              }}
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10"
            >
              <Image
                src="/logoherosection.png"
                alt="Growtech Central"
                width={64}
                height={64}
                priority
              />
            </motion.div>

            <h2 className="text-2xl font-semibold text-white">
              Growtech Central
            </h2>
            <p className="mt-2 text-sm text-purple-200/90">
              {message || 'Menyiapkan halaman...'}
            </p>

            <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-300"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.1,
                  ease: 'easeInOut',
                }}
              />
            </div>

            <p className="mt-4 text-xs tracking-[0.2em] text-white/50 uppercase">
              Smoothing runtime handoff
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}