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

  const meta = log.meta || {}

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

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


      {/* MAIN CARDS */}
      <div className="grid md:grid-cols-2 gap-6">

        <Card title="Informasi Aktivitas">

          <Info label="Tanggal">
            {new Date(log.created_at).toLocaleString()}
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

          <Info label="Module">
            {log.module}
          </Info>

          <Info label="Scope">
            {log.scope}
          </Info>

          <Info label="Status">
            <span className={
              log.status === "success"
                ? "bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs"
                : "bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs"
            }>
              {log.status}
            </span>
          </Info>

          <Info label="Summary">
            {log.summary}
          </Info>

        </Card>


        <Card title="Admin User">

          <Info label="Full Name">
            {log.user?.full_name}
          </Info>

          <Info label="Username">
            {log.user?.name}
          </Info>

          <Info label="Email">
            {log.user?.email}
          </Info>

        </Card>

      </div>

      {/* REQUEST */}
      {meta.request && (
        <Card title="Request Info">

          <Info label="Method">
            {meta.request.method}
          </Info>

          <Info label="Route">
            {meta.request.route}
          </Info>

          <Info label="Path">
            {meta.request.path}
          </Info>

          <Info label="Full URL">
            <span className="text-xs text-gray-400 break-all">
              {meta.request.full_url}
            </span>
          </Info>

        </Card>
      )}

      {/* REQUEST PAYLOAD */}
      {meta.request?.payload && (
        <ObjectTable
          title="Request Payload"
          data={meta.request.payload}
        />
      )}

      {/* RESPONSE INFO */}
      {meta.response_status_code && (
        <Card title="Response Info">

          <Info label="Status Code">
            {meta.response_status_code}
          </Info>

          <Info label="Success">
            {meta.response_success ? "true" : "false"}
          </Info>

          <Info label="Error">
            {meta.response_error || "-"}
          </Info>

        </Card>
      )}


      {/* CONTEXT */}
      {meta.context && (
        <Card title="Request Context">

          <Info label="IP Address">
            {meta.context.ip}
          </Info>

          <Info label="User Agent">
            <span className="text-xs text-gray-400 break-all">
              {meta.context.user_agent}
            </span>
          </Info>

        </Card>
      )}



      {/* TARGET ENTITY */}
      {meta.target && (
        <ObjectTable
          title="Target Entity"
          data={meta.target}
        />
      )}



      {/* BEFORE AFTER SNAPSHOT */}
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



      {/* CHANGES DIFF */}
      {meta.changes && (
        <div className="bg-slate-900 border border-purple-600 rounded-xl p-6 hover:shadow-xl transition">

          <h2 className="text-lg font-semibold mb-4">
            Changes
          </h2>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="text-gray-400 border-b border-slate-700">
                <tr>
                  <th className="text-left p-2">Field</th>
                  <th className="text-left p-2 text-red-400">Before</th>
                  <th className="text-left p-2 text-green-400">After</th>
                </tr>
              </thead>

              <tbody>

                {Object.entries(meta.changes).map(([key, val]) => (

                  <tr
                    key={key}
                    className="border-b border-slate-800 hover:bg-slate-800 transition"
                  >

                    <td className="p-2 font-semibold">
                      {key}
                    </td>

                    <td className="p-2 text-red-300">
                      {typeof val.before === "object"
                        ? JSON.stringify(val.before)
                        : val.before}
                    </td>

                    <td className="p-2 text-green-300">
                      {typeof val.after === "object"
                        ? JSON.stringify(val.after)
                        : val.after}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  )
}



/* CARD */
function Card({ title, children }) {

  return (
    <div className="
      bg-slate-900
      border border-purple-600
      rounded-xl
      p-6
      hover:shadow-xl
      transition
    ">

      <h2 className="text-lg font-semibold mb-4">
        {title}
      </h2>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {children}
      </div>

    </div>
  )
}



/* INFO */
function Info({ label, children }) {

  return (
    <div className="hover:bg-slate-800 p-2 rounded transition">

      <p className="text-gray-400 text-xs mb-1">
        {label}
      </p>

      <div className="font-medium">
        {children || "-"}
      </div>

    </div>
  )
}



/* OBJECT TABLE */
function ObjectTable({ title, data, color }) {

  const border =
    color === "red"
      ? "border-red-500/40"
      : color === "green"
      ? "border-green-500/40"
      : "border-purple-600"

  return (
    <div className={`
      bg-slate-900
      border ${border}
      rounded-xl
      p-6
      hover:shadow-xl
      transition
    `}>

      <h2 className="text-lg font-semibold mb-4">
        {title}
      </h2>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <tbody>

            {Object.entries(data).map(([key, value]) => (

              <tr
                key={key}
                className="border-b border-slate-800 hover:bg-slate-800 transition"
              >

                <td className="p-2 text-gray-400 w-48">
                  {key}
                </td>

                <td className="p-2">

                  {typeof value === "object"
                    ? <pre className="text-xs bg-black p-2 rounded overflow-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    : value?.toString()
                  }

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}