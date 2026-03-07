'use client'

import { usePathname, useRouter } from 'next/navigation'
import Tabs from '../../components/admin/Tabs'
import PermissionGate from '../../components/admin/PermissionGate'

export default function KonfigurasiLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    { label: 'Website', value: '/admin/konfigurasi/website' },
    { label: 'Kontak', value: '/admin/konfigurasi/kontak' },
    { label: 'Pengumuman', value: '/admin/konfigurasi/pengumuman' },
    { label: 'Payment', value: '/admin/konfigurasi/payment' },
  ]

  return (
    <PermissionGate permission="manage_site_settings">
      <div className="p-10 text-white space-y-8">
        <h1 className="text-3xl font-bold">Konfigurasi</h1>

        <Tabs
          tabs={tabs.map(t => ({
            label: t.label,
            value: t.value,
          }))}
          active={pathname}
          onChange={(v) => router.push(v)}
        />

        {children}
      </div>
    </PermissionGate>  
  )
}
