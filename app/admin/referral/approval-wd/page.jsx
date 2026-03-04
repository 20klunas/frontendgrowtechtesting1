'use client'

import { useEffect, useState } from "react"
import { Check, X, Loader2, DollarSign } from "lucide-react"
import { authFetch } from "../../lib/authFetch"
import ReferralTabs from "../components/ReferralTabs"
import TableWrapper from "../components/TableWrapper"
import FilterBar from "../components/FilterBar"

export default function ApprovalWDPage() {

  const [withdraws, setWithdraws] = useState([])
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState("pending")

  const [actionLoading, setActionLoading] = useState(null)

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchWithdraws()
  }, [statusFilter])

  async function fetchWithdraws() {

    try {

      setLoading(true)

      const json = await authFetch(
        `/api/v1/admin/withdraws?status=${statusFilter}`
      )

      setWithdraws(json.data?.data || [])

    } catch (err) {

      console.error("Withdraw fetch error:", err.message)

    } finally {

      setLoading(false)

    }

  }

  /* ================= APPROVE ================= */

  async function approveWithdraw(id) {

    try {

      setActionLoading(id)

      await authFetch(`/api/v1/admin/withdraws/${id}/approve`, {
        method: "POST"
      })

      fetchWithdraws()

    } catch (err) {

      alert(err.message)

    } finally {

      setActionLoading(null)

    }

  }

  /* ================= REJECT ================= */

  async function rejectWithdraw(id) {

    const reason = prompt("Reason reject?")

    try {

      setActionLoading(id)

      await authFetch(`/api/v1/admin/withdraws/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason })
      })

      fetchWithdraws()

    } catch (err) {

      alert(err.message)

    } finally {

      setActionLoading(null)

    }

  }

  /* ================= MARK PAID ================= */

  async function markPaid(id) {

    try {

      setActionLoading(id)

      await authFetch(`/api/v1/admin/withdraws/${id}/mark-paid`, {
        method: "POST"
      })

      fetchWithdraws()

    } catch (err) {

      alert(err.message)

    } finally {

      setActionLoading(null)

    }

  }

  return (

    <div className="p-4 md:p-8 text-white">

      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        Admin Referral Withdraw
      </h1>

      <ReferralTabs />

      {/* ================= FILTER ================= */}

      <div className="flex gap-3 my-6 flex-wrap">

        {["pending","approved","paid","rejected"].map(s => (

          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg border transition ${
              statusFilter === s
                ? "bg-purple-600 border-purple-600"
                : "border-gray-700 hover:bg-gray-800"
            }`}
          >
            {s}
          </button>

        ))}

      </div>

      {/* ================= TABLE ================= */}

      <TableWrapper>

        {loading ? (

          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="border-b border-gray-700 text-gray-300">

                <tr>
                  <th className="py-3 text-left">ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {withdraws.map(w => (

                  <tr
                    key={w.id}
                    className="border-b border-gray-800 hover:bg-gray-900"
                  >

                    <td className="py-3">{w.id}</td>

                    <td>{w.user?.name}</td>

                    <td className="text-gray-400 text-xs">
                      {w.user?.email}
                    </td>

                    <td className="text-green-400">
                      Rp {Number(w.amount).toLocaleString()}
                    </td>

                    <td className={
                      w.status === "approved"
                        ? "text-green-400"
                        : w.status === "rejected"
                        ? "text-red-400"
                        : w.status === "paid"
                        ? "text-blue-400"
                        : "text-yellow-400"
                    }>
                      {w.status}
                    </td>

                    <td className="text-gray-400 text-xs">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>

                    <td className="flex gap-2 py-3 flex-wrap">

                      {w.status === "pending" && (

                        <>
                          <button
                            onClick={() => approveWithdraw(w.id)}
                            className="bg-green-600 px-3 py-1 rounded flex items-center gap-1"
                          >
                            {actionLoading === w.id
                              ? <Loader2 size={14} className="animate-spin"/>
                              : <Check size={14}/>
                            }
                            Approve
                          </button>

                          <button
                            onClick={() => rejectWithdraw(w.id)}
                            className="bg-red-600 px-3 py-1 rounded flex items-center gap-1"
                          >
                            <X size={14}/>
                            Reject
                          </button>
                        </>

                      )}

                      {w.status === "approved" && (

                        <button
                          onClick={() => markPaid(w.id)}
                          className="bg-blue-600 px-3 py-1 rounded flex items-center gap-1"
                        >
                          <DollarSign size={14}/>
                          Mark Paid
                        </button>

                      )}

                    </td>

                  </tr>

                ))}

                {!withdraws.length && (

                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-500">
                      No withdraw requests
                    </td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>

        )}

      </TableWrapper>

    </div>

  )

}