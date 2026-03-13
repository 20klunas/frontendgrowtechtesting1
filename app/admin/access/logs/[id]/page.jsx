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

      const res = await fetch(`${API}/api/v1/admin/audit-logs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      })

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

  const meta = log.meta || {}

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            Audit Log Detail
          </h1>
          <p className="text-gray-400 text-sm">
            Log ID #{log.id}
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded-lg text-sm shadow-lg"
        >
          ← Kembali
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Informasi Aktivitas">
          <Info label="Tanggal">
            {new Date(log.created_at).toLocaleString()}
          </Info>

          <Info label="Action">{log.action}</Info>
          <Info label="Entity">{log.entity}</Info>
          <Info label="Entity ID">{log.entity_id ?? "-"}</Info>
          <Info label="Module">{log.module}</Info>
          <Info label="Scope">{log.scope}</Info>

          <Info label="Status">
            <span
              className={
                log.status === "success"
                  ? "inline-flex items-center rounded-full bg-green-500/20 text-green-400 px-2.5 py-1 text-xs font-semibold border border-green-500/30"
                  : "inline-flex items-center rounded-full bg-red-500/20 text-red-400 px-2.5 py-1 text-xs font-semibold border border-red-500/30"
              }
            >
              {log.status}
            </span>
          </Info>

          <Info label="Summary">{log.summary}</Info>
        </Card>

        <Card title="Admin User">
          <Info label="Full Name">{log.user?.full_name}</Info>
          <Info label="Username">{log.user?.name}</Info>
          <Info label="Email">{log.user?.email}</Info>
        </Card>
      </div>

      {meta.request && (
        <Card title="Request Info">
          <Info label="Method">{meta.request.method}</Info>
          <Info label="Route">{meta.request.route}</Info>
          <Info label="Path">{meta.request.path}</Info>
          <Info label="Full URL">
            <span className="text-xs text-gray-400 break-all">
              {meta.request.full_url}
            </span>
          </Info>
        </Card>
      )}

      {meta.request?.payload && (
        <ObjectTable
          title="Request Payload"
          data={meta.request.payload}
        />
      )}

      {meta.response_status_code && (
        <Card title="Response Info">
          <Info label="Status Code">{meta.response_status_code}</Info>
          <Info label="Success">{meta.response_success ? "true" : "false"}</Info>
          <Info label="Error">{meta.response_error || "-"}</Info>
        </Card>
      )}

      {meta.context && (
        <Card title="Request Context">
          <Info label="IP Address">{meta.context.ip}</Info>
          <Info label="User Agent">
            <span className="text-xs text-gray-400 break-all">
              {meta.context.user_agent}
            </span>
          </Info>
        </Card>
      )}

      {meta.target && (
        <ObjectTable
          title="Target Entity"
          data={meta.target}
        />
      )}

      {(meta.before || meta.after) && (
        <div className="grid md:grid-cols-2 gap-6">
          {meta.before && (
            <ObjectTable
              title="Before Data"
              data={meta.before}
              color="red"
            />
          )}

          {meta.after && (
            <ObjectTable
              title="After Data"
              data={meta.after}
              color="green"
            />
          )}
        </div>
      )}

      {meta.changes && (
        <ChangesTable changes={meta.changes} />
      )}
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div
      className="
        bg-slate-900
        border border-purple-600
        rounded-xl
        p-6
        hover:shadow-xl
        transition
      "
    >
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {children}
      </div>
    </div>
  )
}

function Info({ label, children }) {
  return (
    <div className="hover:bg-slate-800/70 p-3 rounded-lg transition border border-slate-800">
      <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">
        {label}
      </p>

      <div className="font-medium break-words">
        {children || "-"}
      </div>
    </div>
  )
}

function ObjectTable({ title, data, color }) {
  const border =
    color === "red"
      ? "border-red-500/40"
      : color === "green"
      ? "border-green-500/40"
      : "border-purple-600"

  return (
    <div
      className={`
        bg-slate-900
        border ${border}
        rounded-xl
        p-6
        hover:shadow-xl
        transition
      `}
    >
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(data).map(([key, value]) => (
              <tr
                key={key}
                className="border-b border-slate-800 hover:bg-slate-800/60 transition align-top"
              >
                <td className="p-3 text-gray-400 w-44 md:w-56 font-medium bg-slate-950/40">
                  {formatKey(key)}
                </td>

                <td className="p-3">
                  <ValueRenderer value={value} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ChangesTable({ changes }) {
  return (
    <div className="bg-slate-900 border border-purple-600 rounded-xl p-6 hover:shadow-xl transition">
      <h2 className="text-lg font-semibold mb-4">Changes</h2>

      <div className="overflow-hidden rounded-xl border border-slate-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-gray-300 border-b border-slate-700 bg-slate-950/50">
            <tr>
              <th className="text-left p-3">Field</th>
              <th className="text-left p-3 text-red-400">Before</th>
              <th className="text-left p-3 text-green-400">After</th>
            </tr>
          </thead>

          <tbody>
            {Object.entries(changes).map(([key, val]) => (
              <tr
                key={key}
                className="border-b border-slate-800 hover:bg-slate-800/60 transition align-top"
              >
                <td className="p-3 font-semibold text-white">
                  {formatKey(key)}
                </td>

                <td className="p-3 text-red-200">
                  <ValueRenderer value={val?.before} compact />
                </td>

                <td className="p-3 text-green-200">
                  <ValueRenderer value={val?.after} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ValueRenderer({ value, compact = false, depth = 0 }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-500 italic">-</span>
  }

  if (typeof value === "boolean") {
    return (
      <span
        className={
          value
            ? "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30"
            : "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30"
        }
      >
        {value ? "true" : "false"}
      </span>
    )
  }

  if (typeof value === "number") {
    return <span className="text-white">{value}</span>
  }

  if (typeof value === "string") {
    const isLong = value.length > 120

    return (
      <div
        className={
          compact
            ? "text-sm break-words whitespace-pre-wrap"
            : isLong
            ? "text-sm break-words whitespace-pre-wrap bg-black/40 border border-slate-800 rounded-lg px-3 py-2"
            : "text-sm break-words"
        }
      >
        {value}
      </div>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-500 italic">Array kosong</span>
    }

    const allPrimitive = value.every(
      (item) =>
        item === null ||
        item === undefined ||
        ["string", "number", "boolean"].includes(typeof item)
    )

    if (allPrimitive) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="px-2.5 py-1 rounded-full text-xs border border-slate-700 bg-slate-800 text-slate-200"
            >
              {String(item)}
            </span>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-800 bg-black/30 p-3"
          >
            <div className="text-xs text-purple-300 mb-2 font-semibold">
              Item #{index + 1}
            </div>
            <ValueRenderer value={item} compact={compact} depth={depth + 1} />
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === "object") {
    const entries = Object.entries(value)

    if (entries.length === 0) {
      return <span className="text-gray-500 italic">Object kosong</span>
    }

    return (
      <div className="rounded-lg border border-slate-800 overflow-hidden bg-black/20">
        {entries.map(([objKey, objValue], index) => (
          <div
            key={objKey}
            className={`grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] ${
              index !== entries.length - 1 ? "border-b border-slate-800" : ""
            }`}
          >
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-300 bg-slate-950/60">
              {formatKey(objKey)}
            </div>

            <div className="px-3 py-2 min-w-0">
              <ValueRenderer
                value={objValue}
                compact={compact}
                depth={depth + 1}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <span className="text-white">{String(value)}</span>
}

function formatKey(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\./g, " → ")
}