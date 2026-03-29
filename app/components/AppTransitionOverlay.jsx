'use client'

import { AnimatePresence, motion } from 'framer-motion'

export default function AppTransitionOverlay({ active, message }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="app-transition-overlay"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[200]"
        >
          <div className="mx-auto w-full max-w-7xl px-4 pt-3">
            <div className="overflow-hidden rounded-2xl border border-purple-500/30 bg-[#090011]/92 shadow-[0_0_30px_rgba(168,85,247,0.18)] backdrop-blur">
              <div className="px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-purple-300/80">
                  Growtech Central
                </p>
                <p className="mt-1 text-sm text-white/90">
                  {message || 'Menyiapkan halaman...'}
                </p>
              </div>
              <div className="h-1 w-full bg-white/10">
                <motion.div
                  className="h-full w-1/3 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-300"
                  initial={{ x: '-110%' }}
                  animate={{ x: '320%' }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
