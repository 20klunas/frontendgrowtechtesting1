'use client'

import { useState, useEffect } from 'react'
import Cookies from "js-cookie"

const API = process.env.NEXT_PUBLIC_API_URL

export default function DataDepositPage() {

  const token = Cookies.get("token")

  const [activeTab, setActiveTab] = useState('topups')

  const [topups, setTopups] = useState([])
  const [ledger, setLedger] = useState([])

  const [topupPagination, setTopupPagination] = useState(null)
  const [ledgerPagination, setLedgerPagination] = useState(null)

  const [loading, setLoading] = useState(false)

  const [statusFilter, setStatusFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')

  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)

  const REASONS = [
    { value: "RESCUE_WEBHOOK", label: "Rescue topup (webhook gagal)" },
    { value: "RESCUE_PAID_NOT_POSTED", label: "Rescue topup (paid tapi saldo belum masuk)" },
    { value: "COMPENSATION", label: "Kompensasi" },
    { value: "BONUS", label: "Bonus / goodwill" },
    { value: "BUG_FIX", label: "Koreksi bug" },
    { value: "MANUAL_TRANSFER", label: "Manual topup (bukti transfer)" },
    { value: "OTHER", label: "Lainnya" },
  ];

  const [manualTopup, setManualTopup] = useState({
    user_id: '',
    amount: '',
    reason: 'RESCUE_PAID_NOT_POSTED',
    reference: '',
    detail: ''
  })

  const buildNote = (reason, reference, detail) => {
    const parts = []
    if (reason) parts.push(reason)
    if (reference?.trim()) parts.push(reference.trim())
    if (detail?.trim()) parts.push(detail.trim())
    return parts.join(' - ')
  }

  const [adjustForm, setAdjustForm] = useState({
    user_id: '',
    direction: 'credit',
    amount: '',
    note: ''
  })

  useEffect(() => {
    fetchTopups()
    fetchLedger()
  }, [])

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID").format(value)
  }

  /* =========================
     FETCH TOPUPS
  ========================== */
  const fetchTopups = async (page = 1) => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.append("per_page", 10)
      params.append("page", page)

      if (statusFilter) params.append("status", statusFilter)
      if (userIdFilter) params.append("user_id", userIdFilter)

      const res = await fetch(
        `${API}/api/v1/admin/wallet/topups?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      )

      const result = await res.json()

      if (result.success) {
        setTopups(result.data.data)
        setTopupPagination(result.data)
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /* =========================
     FETCH LEDGER
  ========================== */
  const fetchLedger = async (page = 1) => {
    try {
      setLoading(true)

      const res = await fetch(
        `${API}/api/v1/admin/wallet/ledger?per_page=10&page=${page}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      )

      const result = await res.json()

      if (result.success) {
        setLedger(result.data.data)
        setLedgerPagination(result.data)
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /* =========================
     MANUAL TOPUP
  ========================== */
  const handleManualTopup = async (e) => {
    e.preventDefault()

    try {
      const res = await fetch(
        `${API}/api/v1/admin/wallet/topup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: Number(manualTopup.user_id),
            amount: Number(manualTopup.amount),
            note: buildNote(
              manualTopup.reason,
              manualTopup.reference,
              manualTopup.detail
            )
          })
        }
      )

      const result = await res.json()

      if (result.success) {
        alert("Manual topup berhasil")
        setManualTopup({
          user_id: '',
          amount: '',
          reason: 'RESCUE_PAID_NOT_POSTED',
          reference: '',
          detail: ''
        })
        fetchLedger()
      }

    } catch (err) {
      console.error(err)
    }
  }

  /* =========================
     FETCH USERS (FOR SELECT)
  ========================== */
  const fetchUsers = async (search = '', page = 1) => {
    try {
      const res = await fetch(
        `${API}/api/v1/admin/users?page=${page}&limit=10&search=${search}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      )

      const result = await res.json()

      if (result?.data?.data) {
        setUsers(result.data.data)
      }

    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (activeTab === 'manual') {
      fetchUsers()
    }
  }, [activeTab])

  /* =========================
     ADJUST BALANCE
  ========================== */
  const handleAdjust = async (e) => {
    e.preventDefault()

    try {
      const res = await fetch(
        `${API}/api/v1/admin/wallet/adjust`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...adjustForm,
            amount: Number(adjustForm.amount)
          })
        }
      )

      const result = await res.json()

      if (result.success) {
        alert("Adjust balance berhasil")
        setAdjustForm({
          user_id: '',
          direction: 'credit',
          amount: '',
          note: ''
        })
        fetchLedger()
      }

    } catch (err) {
      console.error(err)
    }
  }

  return (
    <section className="p-6">

      <h1 className="text-3xl font-bold mb-6">Admin Wallet Management</h1>

      {/* ================= TABS ================= */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setActiveTab('topups')}
          className={activeTab === 'topups' ? 'btn-primary' : 'btn-outline'}>
          User Deposit
        </button>
        <button onClick={() => setActiveTab('ledger')}
          className={activeTab === 'ledger' ? 'btn-primary' : 'btn-outline'}>
          Ledger
        </button>
        <button onClick={() => setActiveTab('manual')}
          className={activeTab === 'manual' ? 'btn-primary' : 'btn-outline'}>
          Manual Topup
        </button>
        <button onClick={() => setActiveTab('adjust')}
          className={activeTab === 'adjust' ? 'btn-primary' : 'btn-outline'}>
          Adjust Balance
        </button>
      </div>

      {/* ================= USER TOPUPS ================= */}
      {activeTab === 'topups' && (
        <div className="border rounded-xl p-4">
          <div className="flex gap-3 mb-4">
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>

            <input
              className="input"
              placeholder="User ID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
            />

            <button
              onClick={() => fetchTopups()}
              className="btn-outline">
              Filter
            </button>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th>ID</th>
                <th>Order</th>
                <th>Status</th>
                <th>User</th>
                <th>Amount</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {topups.map(item => (
                <tr key={item.id} className="border-b">
                  <td>{item.id}</td>
                  <td>{item.order_id}</td>
                  <td>{item.status}</td>
                  <td>{item.user?.name}</td>
                  <td>Rp {formatRupiah(item.amount)}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= LEDGER (UPDATED) ================= */}
      {activeTab === 'ledger' && (
        <div className="border rounded-xl p-4 overflow-x-auto">

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th>ID</th>
                <th>Wallet</th>
                <th>Email</th>
                <th>Direction</th>
                <th>Amount</th>
                <th>Before</th>
                <th>After</th>
                <th>TX Type</th>
                <th>Status</th>
                <th>Note</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {ledger.map(item => (
                <tr key={item.id} className="border-b">

                  <td>{item.id}</td>

                  <td>
                    {item.wallet?.code ?? `Wallet #${item.wallet_id}`}
                  </td>

                  <td>
                    {item.wallet?.user?.email ?? '-'}
                  </td>

                  <td>
                    <span className={
                      item.direction === 'CREDIT'
                        ? 'text-green-500 font-semibold'
                        : 'text-red-500 font-semibold'
                    }>
                      {item.direction}
                    </span>
                  </td>

                  <td>Rp {formatRupiah(item.amount)}</td>

                  <td>Rp {formatRupiah(item.balance_before)}</td>

                  <td>Rp {formatRupiah(item.balance_after)}</td>

                  <td>{item.transaction?.type}</td>

                  <td>{item.transaction?.status}</td>

                  <td>
                    {item.transaction?.note ?? '-'}
                  </td>

                  <td>
                    {new Date(item.created_at).toLocaleString("id-ID")}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Ledger */}
          {ledgerPagination && (
            <div className="flex justify-end gap-3 mt-4">
              <button
                disabled={!ledgerPagination.prev_page_url}
                onClick={() => fetchLedger(ledgerPagination.current_page - 1)}
                className="btn-outline">
                Prev
              </button>

              <span>
                Page {ledgerPagination.current_page} / {ledgerPagination.last_page}
              </span>

              <button
                disabled={!ledgerPagination.next_page_url}
                onClick={() => fetchLedger(ledgerPagination.current_page + 1)}
                className="btn-outline">
                Next
              </button>
            </div>
          )}

        </div>
      )}

      {/* ================= MANUAL TOPUP ================= */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualTopup} className="border rounded-xl p-4 space-y-4">

          {/* USER SELECT WITH SEARCH */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Cari email user..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value)
                fetchUsers(e.target.value, 1)
              }}
              className="input w-full"
            />

            <select
              className="input w-full"
              value={manualTopup.user_id}
              onChange={(e) =>
                setManualTopup({ ...manualTopup, user_id: e.target.value })
              }
              required
            >
              <option value="">-- Pilih User --</option>

              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.email} ({user.name})
                </option>
              ))}
            </select>
          </div>

          <input
            className="input w-full"
            type="number"
            placeholder="Amount"
            value={manualTopup.amount}
            onChange={(e) =>
              setManualTopup({ ...manualTopup, amount: e.target.value })
            }
            required
          />

          <select
            className="input w-full"
            value={manualTopup.reason}
            onChange={(e) =>
              setManualTopup({ ...manualTopup, reason: e.target.value })
            }
          >
            {REASONS.map(r => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <input
            className="input w-full"
            placeholder="Reference (optional) contoh: topup_id=4 / order_id=TOPUP-123"
            value={manualTopup.reference}
            onChange={(e) =>
              setManualTopup({ ...manualTopup, reference: e.target.value })
            }
          />

          <textarea
            className="input w-full"
            placeholder="Detail tambahan"
            rows={3}
            value={manualTopup.detail}
            onChange={(e) =>
              setManualTopup({ ...manualTopup, detail: e.target.value })
            }
          />

          {/* Preview Note */}
          <div className="text-sm bg-gray-50 p-3 rounded">
            <div className="font-semibold">Preview note:</div>
            <div className="font-mono text-gray-700">
              {buildNote(
                manualTopup.reason,
                manualTopup.reference,
                manualTopup.detail
              ) || '-'}
            </div>
          </div>

          <button className="btn-primary w-full">
            Submit Manual Topup
          </button>
        </form>
      )}

      {/* ================= ADJUST ================= */}
      {activeTab === 'adjust' && (
        <form onSubmit={handleAdjust} className="border rounded-xl p-4 space-y-4">
          <input
            className="input w-full"
            placeholder="User ID"
            value={adjustForm.user_id}
            onChange={(e) => setAdjustForm({...adjustForm, user_id: e.target.value})}
            required
          />
          <select
            className="input w-full"
            value={adjustForm.direction}
            onChange={(e) => setAdjustForm({...adjustForm, direction: e.target.value})}
          >
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input
            className="input w-full"
            type="number"
            placeholder="Amount"
            value={adjustForm.amount}
            onChange={(e) => setAdjustForm({...adjustForm, amount: e.target.value})}
            required
          />
          <textarea
            className="input w-full"
            placeholder="Note"
            value={adjustForm.note}
            onChange={(e) => setAdjustForm({...adjustForm, note: e.target.value})}
          />
          <button className="btn-primary w-full">Submit Adjust</button>
        </form>
      )}

    </section>
  )
}