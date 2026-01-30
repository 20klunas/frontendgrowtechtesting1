'use client'

import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

export default function DataDepositPage() {
  // const data = type === 'user' ? dataUserDeposit : dataAdminTopup
  const [type, setType] = useState('user') // user | admin
  const [data, setData] = useState([])

  useEffect(() => {
    fetchDeposits()
  }, [])

  const fetchDeposits = async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/topups`)
      const result = await res.json()

      if (result.success) {
        setData(result.data)
      }
    } catch (err) {
      console.error("Gagal ambil data deposit", err)
    }
  }

  const dataUserDeposit = [
    {
      id: 101532,
      invoice: 'INV-20241220-001',
      metode: 'Qris GrowTech',
      username: 'Ono',
      produk: 'Top up Rp 200.000',
      harga: 'Rp 201.500'
    }
  ]

  const dataAdminTopup = [
    {
      id: 101532,
      invoice: 'INV-20241220-001',
      metode: 'Admin TopUp',
      username: 'Ono',
      produk: 'Manual Admin Add',
      harga: 'Rp 201.500'
    }
  ]

  return (
    <section className="p-6">
      <h1 className="text-3xl font-bold mb-4">Data Deposit</h1>

      {/* ACTION */}
      <div className="flex gap-3 mb-4">
        <button className="btn-primary">Salin Invoice</button>
        <button className="btn-secondary">Download Data</button>
      </div>

      {/* FILTER + TOGGLE */}
      <div className="border border-purple-500 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button className="btn-outline">Filter</button>
            <input
              className="input w-[300px]"
              placeholder="Search..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setType('admin')}
              className={type === 'admin' ? 'btn-primary' : 'btn-outline'}
            >
              Admin TopUp
            </button>
            <button
              onClick={() => setType('user')}
              className={type === 'user' ? 'btn-primary' : 'btn-outline'}
            >
              User Deposit
            </button>
          </div>
        </div>

        {/* TABLE */}
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th><input type="checkbox" /></th>
              <th>ID</th>
              <th>Invoice</th>
              <th>Metode</th>
              <th>Username</th>
              <th>Produk</th>
              <th>Harga</th>
            </tr>
          </thead>
          {/* <tbody>
            {data.map((item, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td><input type="checkbox" /></td>
                <td>{item.id}</td>
                <td>{item.invoice}</td>
                <td>{item.metode}</td>
                <td>{item.username}</td>
                <td>{item.produk}</td>
                <td>{item.harga}</td>
              </tr>
            ))}
          </tbody> */}
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-gray-800">
                <td><input type="checkbox" /></td>
                <td>{item.id}</td>
                <td>{item.order_id}</td>
                <td>{item.method || "QRIS"}</td>
                <td>{item.user?.name || "User"}</td>
                <td>Topup Saldo</td>
                <td>Rp {item.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn-outline">{'<'}</button>
          <button className="btn-outline">1</button>
          <button className="btn-outline">2</button>
          <button className="btn-outline">{'>'}</button>
        </div>
      </div>
    </section>
  )
}
