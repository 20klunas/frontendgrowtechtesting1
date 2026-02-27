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

  const [manualTopup, setManualTopup] = useState({
    user_id: '',
    amount: '',
    note: ''
  })

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
            ...manualTopup,
            amount: Number(manualTopup.amount)
          })
        }
      )

      const result = await res.json()

      if (result.success) {
        alert("Manual topup berhasil")
        setManualTopup({ user_id: '', amount: '', note: '' })
        fetchLedger()
      }

    } catch (err) {
      console.error(err)
    }
  }

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

      {/* ================= LEDGER ================= */}
      {activeTab === 'ledger' && (
        <div className="border rounded-xl p-4">

          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th>ID</th>
                <th>User ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map(item => (
                <tr key={item.id} className="border-b">
                  <td>{item.id}</td>
                  <td>{item.wallet?.user_id}</td>
                  <td>{item.type}</td>
                  <td>Rp {formatRupiah(item.amount)}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MANUAL TOPUP ================= */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualTopup} className="border rounded-xl p-4 space-y-4">
          <input
            className="input w-full"
            placeholder="User ID"
            value={manualTopup.user_id}
            onChange={(e) => setManualTopup({...manualTopup, user_id: e.target.value})}
            required
          />
          <input
            className="input w-full"
            placeholder="Amount"
            type="number"
            value={manualTopup.amount}
            onChange={(e) => setManualTopup({...manualTopup, amount: e.target.value})}
            required
          />
          <textarea
            className="input w-full"
            placeholder="Note"
            value={manualTopup.note}
            onChange={(e) => setManualTopup({...manualTopup, note: e.target.value})}
          />
          <button className="btn-primary w-full">Submit Manual Topup</button>
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