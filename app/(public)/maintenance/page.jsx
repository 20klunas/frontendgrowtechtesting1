'use client'

import { useSearchParams } from 'next/navigation'

export default function MaintenancePage() {

  const params = useSearchParams()

  const message = params.get('message') || 'Website sedang maintenance'
  const scope = params.get('scope') || 'system'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="bg-white shadow-xl rounded-xl p-10 max-w-lg text-center">

        <h1 className="text-3xl font-bold mb-4">
          🚧 Maintenance
        </h1>

        <p className="text-gray-600 mb-4">
          {message}
        </p>

        <div className="text-sm text-gray-400">
          Scope : {scope}
        </div>

      </div>

    </div>
  )
}