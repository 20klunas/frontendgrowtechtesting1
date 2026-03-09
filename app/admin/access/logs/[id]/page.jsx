"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Cookies from "js-cookie"

const API = process.env.NEXT_PUBLIC_API_URL

export default function AuditLogDetailPage() {

  const { id } = useParams()
  const router = useRouter()

  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchLog = async () => {

    try {

      const token = Cookies.get("token")

      const res = await fetch(
        `${API}/api/v1/admin/audit-logs/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          }
        }
      )

      const json = await res.json()

      if (json.success) {
        setLog(json.data)
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchLog()
  }, [id])


  if (loading) {
    return (
      <div className="p-6 text-white">
        Loading audit log...
      </div>
    )
  }

  if (!log) {
    return (
      <div className="p-6 text-white">
        Audit log tidak ditemukan
      </div>
    )
  }

  const changes = log.meta?.changes || {}

  return (
    <div className="p-6 text-white max-w-6xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold">
            Audit Log Detail
          </h1>

          <p className="text-gray-400 text-sm mt-1">
            ID #{log.id}
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-sm"
        >
          ← Kembali
        </button>

      </div>

      {/* MAIN INFO */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* LEFT CARD */}
        <div className="bg-slate-900 border border-purple-600 rounded-xl p-6 space-y-4">

          <h2 className="text-lg font-semibold mb-2">
            Informasi Aktivitas
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">

            <Info label="Tanggal">
              {new Date(log.created_at).toLocaleString()}
            </Info>

            <Info label="Module">
              {log.module}
            </Info>

            <Info label="Action">
              {log.action}
            </Info>

            <Info label="Entity">
              {log.entity}
            </Info>

            <Info label="Entity ID">
              {log.entity_id}
            </Info>

            <Info label="Scope">
              {log.scope}
            </Info>

            <Info label="Status">
              <span
                className={
                  log.status === "success"
                    ? "px-2 py-1 text-xs rounded bg-green-500/20 text-green-400"
                    : "px-2 py-1 text-xs rounded bg-red-500/20 text-red-400"
                }
              >
                {log.status}
              </span>
            </Info>

          </div>

          <div className="pt-3 border-t border-slate-700">
            <p className="text-gray-400 text-sm">Summary</p>
            <p className="mt-1">{log.summary}</p>
          </div>

        </div>


        {/* USER CARD */}
        <div className="bg-slate-900 border border-purple-600 rounded-xl p-6 space-y-4">

          <h2 className="text-lg font-semibold mb-2">
            Admin User
          </h2>

          <div className="space-y-3 text-sm">

            <Info label="Full Name">
              {log.user?.full_name}
            </Info>

            <Info label="Username">
              {log.user?.name}
            </Info>

            <Info label="Email">
              {log.user?.email}
            </Info>

          </div>

        </div>

      </div>


      {/* TARGET */}
      {log.target && (
        <div className="bg-slate-900 border border-purple-600 rounded-xl p-6">

          <h2 className="text-lg font-semibold mb-4">
            Target Entity
          </h2>

          <pre className="bg-black p-4 rounded text-sm overflow-auto border border-slate-700">
            {JSON.stringify(log.target, null, 2)}
          </pre>

        </div>
      )}


      {/* CHANGES */}
      {Object.keys(changes).length > 0 && (
        <div className="bg-slate-900 border border-purple-600 rounded-xl p-6">

          <h2 className="text-lg font-semibold mb-4">
            Perubahan Data
          </h2>

          <div className="space-y-4">

            {Object.entries(changes).map(([field, diff]) => (

              <div
                key={field}
                className="border border-slate-700 rounded-lg p-4"
              >

                <p className="font-semibold mb-3">
                  {field}
                </p>

                <div className="grid md:grid-cols-2 gap-4 text-sm">

                  <div>
                    <p className="text-gray-400 mb-1">Before</p>

                    <pre className="bg-black p-3 rounded border border-red-500/30 text-red-300">
                      {JSON.stringify(diff.before, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <p className="text-gray-400 mb-1">After</p>

                    <pre className="bg-black p-3 rounded border border-green-500/30 text-green-300">
                      {JSON.stringify(diff.after, null, 2)}
                    </pre>
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>
      )}


      {/* META */}
      <div className="bg-slate-900 border border-purple-600 rounded-xl p-6">

        <h2 className="text-lg font-semibold mb-4">
          Meta Data
        </h2>

        <pre className="bg-black p-4 rounded text-sm overflow-auto border border-slate-700">
          {JSON.stringify(log.meta, null, 2)}
        </pre>

      </div>

    </div>
  )
}


/* COMPONENT */
function Info({ label, children }) {
  return (
    <div>
      <p className="text-gray-400 text-xs mb-1">
        {label}
      </p>
      <div className="font-medium">
        {children || "-"}
      </div>
    </div>
  )
}