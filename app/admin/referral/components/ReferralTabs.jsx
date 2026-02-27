'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
      {/* KAPSUL BESAR */}
      <div className="flex bg-black/40 border border-purple-600 rounded-full p-1 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
        {tabs.map((tab) => {
          const active = pathname === tab.href

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                px-6 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${active
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                  : 'text-gray-300 hover:text-white'}
              `}
            >
              {tab.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
