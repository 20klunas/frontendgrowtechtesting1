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
    return <div className="p-6 text-white">Loading...</div>
  }

  if (!log) {
    return <div className="p-6 text-white">Audit log tidak ditemukan</div>
  }

  const meta = log.meta || {}

  return (
    <div className="p-6 text-white max-w-6xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Audit Log Detail</h1>
          <p className="text-gray-400 text-sm">Log ID #{log.id}</p>
        </div>

        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700"
        >
          ← Kembali
        </button>
      </div>

      {/* MAIN INFO */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* ACTIVITY */}
        <Card title="Informasi Aktivitas">

          <Info label="Tanggal">
            {new Date(log.created_at).toLocaleString()}
          </Info>

          <Info label="Action">{log.action}</Info>

          <Info label="Entity">{log.entity}</Info>

          <Info label="Entity ID">{log.entity_id}</Info>

          <Info label="Module">{log.module}</Info>

          <Info label="Scope">{log.scope}</Info>

          <Info label="Status">
            <span className={
              log.status === "success"
                ? "bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs"
                : "bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs"
            }>
              {log.status}
            </span>
          </Info>

          <Info label="Summary">{log.summary}</Info>

        </Card>


        {/* USER */}
        <Card title="Admin User">

          <Info label="Full Name">{log.user?.full_name}</Info>

          <Info label="Username">{log.user?.name}</Info>

          <Info label="Email">{log.user?.email}</Info>

        </Card>

      </div>


      {/* REQUEST INFO */}
      {meta.request && (
        <Card title="Request Info">

          <Info label="Method">{meta.request.method}</Info>

          <Info label="Route">{meta.request.route}</Info>

          <Info label="Path">{meta.request.path}</Info>

        </Card>
      )}


      {/* CONTEXT */}
      {meta.context && (
        <Card title="Request Context">

          <Info label="IP Address">{meta.context.ip}</Info>

          <Info label="User Agent">
            <div className="text-xs text-gray-400 break-all">
              {meta.context.user_agent}
            </div>
          </Info>

        </Card>
      )}


      {/* TARGET */}
      {meta.target && (
        <JsonCard title="Target Entity" data={meta.target} />
      )}


      {/* BEFORE */}
      {meta.before && (
        <JsonCard title="Before Data" data={meta.before} color="red" />
      )}

      {/* AFTER */}
      {meta.after && (
        <JsonCard title="After Data" data={meta.after} color="green" />
      )}


      {/* CHANGES */}
      {meta.changes && (
        <Card title="Changes">

          <div className="space-y-4">

            {Object.entries(meta.changes).map(([field, diff]) => (

              <div
                key={field}
                className="border border-slate-700 rounded-lg p-4"
              >

                <p className="font-semibold mb-2">
                  {field}
                </p>

                <div className="grid md:grid-cols-2 gap-4 text-sm">

                  <JsonBlock label="Before" data={diff.before} color="red" />

                  <JsonBlock label="After" data={diff.after} color="green" />

                </div>

              </div>

            ))}

          </div>

        </Card>
      )}

    </div>
  )
}



/* CARD */
function Card({ title, children }) {
  return (
    <div className="bg-slate-900 border border-purple-600 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {children}
      </div>
    </div>
  )
}


/* JSON CARD */
function JsonCard({ title, data, color }) {

  const border =
    color === "red"
      ? "border-red-500/40"
      : color === "green"
      ? "border-green-500/40"
      : "border-slate-700"

  return (
    <div className={`bg-slate-900 border ${border} rounded-xl p-6`}>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      <pre className="bg-black p-4 rounded text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}


/* JSON BLOCK */
function JsonBlock({ label, data, color }) {

  const border =
    color === "red"
      ? "border-red-500/40 text-red-300"
      : "border-green-500/40 text-green-300"

  return (
    <div>
      <p className="text-gray-400 mb-1">{label}</p>

      <pre className={`bg-black p-3 rounded border ${border}`}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}


/* INFO */
function Info({ label, children }) {
  return (
    <div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <div className="font-medium">{children || "-"}</div>
    </div>
  )
}