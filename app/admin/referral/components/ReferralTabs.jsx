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
    <div className="w-full mt-6 mb-8 overflow-x-auto scrollbar-hide">
      
      {/* capsule wrapper */}
      <div className="referral-tabs inline-flex rounded-full p-1">

        {tabs.map((tab) => {
          const active = pathname === tab.href

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className="relative flex-shrink-0"
            >
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
                className={`relative px-4 md:px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 z-10
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

      </div>
    </div>
  )
}