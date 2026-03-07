'use client'

import { useState } from 'react'
import Tabs from '../../components/admin/Tabs'
import BannerSection from './banner/BannerSection'
import FAQSection from './pengumuman/FAQSection'
import KetentuanSection from './pengumuman/KetentuanSection'
import PrivasiSection from './pengumuman/PrivasiSection'
import PermissionGate from '../../components/admin/PermissionGate'
export default function KontenPage() {
  const [tab, setTab] = useState('banner')

  return (
    <PermissionGate permission="manage_pages">
      <div className="p-10 text-white space-y-8">
        <h1 className="text-3xl font-bold">Konten</h1>

        <Tabs
          tabs={[
            { label: 'Banner', value: 'banner' },
            { label: 'Pengumuman', value: 'pengumuman' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'banner' && <BannerSection />}

        {tab === 'pengumuman' && (
          <div className="space-y-10">
            <FAQSection />
            <KetentuanSection />
            <PrivasiSection />
          </div>
        )}
      </div>
    </PermissionGate>  
  )
}
