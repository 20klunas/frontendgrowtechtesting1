"use client"

import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL

export default function AdminAuditLogsPage() {

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)

  const fetchLogs = async () => {
    try {
      setLoading(true)

        const token = localStorage.getItem("token")

        const res = await fetch(`${API}/api/v1/admin/audit-logs?q=${q}&page=${page}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
        }
        })

        console.log("status:", res.status)

        const json = await res.json()
        console.log("response:", json)


      if (json?.data?.data) {
        setLogs(json.data.data)
      } else {
        setLogs([])
      }

    } catch (err) {
      console.error("Failed load audit logs", err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page])

  return (
    <div className="p-6 text-white">

      <h1 className="text-2xl font-bold mb-6">
        Audit Log Admin
      </h1>

      {/* SEARCH */}
      <div className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari action / user / module..."
          className="bg-slate-900 border border-purple-600 rounded px-3 py-2 w-80"
        />

        <button
          onClick={() => {
            setPage(1)
            fetchLogs()
          }}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
        >
          Cari
        </button>
      </div>

      {/* TABLE */}
      <div className="border border-purple-700 rounded-lg overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-slate-900">
            <tr className="text-left">
              <th className="p-3">Tanggal</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Module</th>
              <th className="p-3">Status</th>
              <th className="p-3">Summary</th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan="7" className="p-6 text-center">
                  Loading audit logs...
                </td>
              </tr>
            )}

            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-400">
                  Tidak ada data log
                </td>
              </tr>
            )}

            {!loading && logs.map((log) => (
              <tr
                key={log.id}
                className="border-t border-slate-800 hover:bg-slate-900 cursor-pointer"
              >

                <td className="p-3">
                  {new Date(log.created_at).toLocaleString()}
                </td>

                <td className="p-3">
                  {log.user?.full_name || log.user?.name || "-"}
                </td>

                <td className="p-3 capitalize">
                  {log.action}
                </td>

                <td className="p-3">
                  {log.entity}
                </td>

                <td className="p-3">
                  {log.module || "-"}
                </td>

                <td className="p-3">
                  <span
                    className={
                      log.status === "success"
                        ? "text-green-400 font-semibold"
                        : "text-red-400 font-semibold"
                    }
                  >
                    {log.status}
                  </span>
                </td>

                <td className="p-3">
                  {log.summary || "-"}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* PAGINATION */}
      <div className="flex gap-3 mt-4">

        <button
          className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>

        <span className="text-gray-400">
          Page {page}
        </span>

        <button
          className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded"
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>

      </div>

    </div>
  )
}