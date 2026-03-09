"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Cookies from "js-cookie"

const API = process.env.NEXT_PUBLIC_API_URL

export default function AuditLogDetailPage() {

  const { id } = useParams()

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
    return <div className="p-6 text-white">Loading...</div>
  }

  if (!log) {
    return <div className="p-6 text-white">Log tidak ditemukan</div>
  }

  return (
    <div className="p-6 text-white max-w-4xl">

      <h1 className="text-2xl font-bold mb-6">
        Detail Audit Log
      </h1>

      <div className="space-y-4 bg-slate-900 border border-purple-600 p-6 rounded-lg">

        <div>
          <b>ID:</b> {log.id}
        </div>

        <div>
          <b>Tanggal:</b> {new Date(log.created_at).toLocaleString()}
        </div>

        <div>
          <b>User:</b> {log.user?.full_name}
        </div>

        <div>
          <b>Email:</b> {log.user?.email}
        </div>

        <div>
          <b>Action:</b> {log.action}
        </div>

        <div>
          <b>Entity:</b> {log.entity}
        </div>

        <div>
          <b>Entity ID:</b> {log.entity_id}
        </div>

        <div>
          <b>Module:</b> {log.module}
        </div>

        <div>
          <b>Status:</b>{" "}
          <span
            className={
              log.status === "success"
                ? "text-green-400"
                : "text-red-400"
            }
          >
            {log.status}
          </span>
        </div>

        <div>
          <b>Summary:</b> {log.summary}
        </div>

        <div>
          <b>Scope:</b> {log.scope}
        </div>

      </div>

      {/* META JSON */}
      <div className="mt-6">

        <h2 className="text-xl font-semibold mb-3">
          Meta Data
        </h2>

        <pre className="bg-black p-4 rounded text-sm overflow-auto border border-slate-700">
          {JSON.stringify(log.meta, null, 2)}
        </pre>

      </div>

    </div>
  )
}