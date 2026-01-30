'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ReferralTabs() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Pengaturan', href: '/admin/referral' },
    { name: 'Monitoring', href: '/admin/referral/monitoring' },
    { name: 'Approval WD', href: '/admin/referral/approval-wd' },
  ]

  return (
    <div className="flex gap-4 mt-6 mb-8">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`px-6 py-2 rounded-full border transition
              ${active
                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                : 'border-purple-500 text-gray-300 hover:bg-purple-700/30'}
            `}
          >
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
