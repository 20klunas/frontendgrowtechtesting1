'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export default function ReferralTabs() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Pengaturan', href: '/admin/referral' },
    { name: 'Monitoring', href: '/admin/referral/monitoring' },
    { name: 'Approval WD', href: '/admin/referral/approval-wd' },
    { name: 'Relations', href: '/admin/referral/relations' },
  ]

  return (
    <div className="flex justify-start mt-6 mb-10">
      {/* Capsule Container */}
      <div className="relative flex bg-black/50 backdrop-blur-lg border border-purple-600/40 rounded-full p-1 shadow-[0_0_25px_rgba(168,85,247,0.25)] overflow-hidden">

        {tabs.map((tab) => {
          const active = pathname === tab.href

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className="relative"
            >
              {/* Sliding Active Background */}
              {active && (
                <motion.div
                  layoutId="activeReferralTab"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-800 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                />
              )}

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 z-10
                  ${active
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white'}
                `}
              >
                {tab.name}
              </motion.div>
            </Link>
          )
        })}

        {/* Subtle Neon Glow Underline */}
        <div className="absolute -bottom-2 left-1/4 w-1/2 h-6 bg-purple-700 opacity-20 blur-2xl rounded-full pointer-events-none" />

      </div>
    </div>
  )
}