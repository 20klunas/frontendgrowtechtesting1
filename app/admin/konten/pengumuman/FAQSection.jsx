'use client'

import { useEffect, useState } from 'react'
import SectionCard from '../../../components/admin/SectionCard'
import ActionButtons from '../../../components/admin/ActionButtons'
import Modal from '../../../components/ui/Modal'
import Cookies from 'js-cookie'

export default function FAQSection() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const token = Cookies.get('token')

  const [faqs, setFaqs] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    question: '',
    answer: '',
    sort_order: 0,
    is_active: true,
  })

  // ================= FETCH FAQ =================
  const fetchFaqs = async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/faqs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      const list = data.data || data
      list.sort((a, b) => a.sort_order - b.sort_order) // urutkan

      setFaqs(list)
    } catch (err) {
      console.error('Gagal ambil FAQ', err)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [])

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  // ================= OPEN ADD =================
  const openAdd = () => {
    setEditing(null)
    setForm({ question: '', answer: '', sort_order: faqs.length + 1, is_active: true })
    setModalOpen(true)
  }

  // ================= OPEN EDIT =================
  const openEdit = (faq) => {
    setEditing(faq)
    setForm({
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    })
    setModalOpen(true)
  }

  // ================= SAVE =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    const url = editing
      ? `${API}/api/v1/admin/faqs/${editing.id}`
      : `${API}/api/v1/admin/faqs`

    const method = editing ? 'PATCH' : 'POST'

    try {
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          sort_order: Number(form.sort_order),
        }),
      })

      setModalOpen(false)
      fetchFaqs()
    } catch (err) {
      console.error('Gagal simpan FAQ', err)
    }
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm('Yakin mau hapus FAQ ini?')) return

    try {
      await fetch(`${API}/api/v1/admin/faqs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchFaqs()
    } catch (err) {
      console.error('Gagal hapus FAQ', err)
    }
  }

  return (
    <SectionCard title="Kelola FAQ">
      <div className="space-y-4">

        {faqs.map((faq) => (
          <div key={faq.id} className="border border-purple-700 rounded-xl p-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">
                {faq.sort_order}. {faq.question}
              </h3>
              <span className="text-xs text-gray-400">Order: {faq.sort_order}</span>
            </div>

            <p className="text-gray-400 text-sm mt-1">{faq.answer}</p>

            <div className="flex justify-between items-center mt-4">
              <span
                className={`px-4 py-1 rounded-full text-sm ${
                  faq.is_active
                    ? 'bg-green-500 text-black'
                    : 'bg-gray-600 text-white'
                }`}
              >
                {faq.is_active ? 'Aktif' : 'Nonaktif'}
              </span>

              <ActionButtons
                onEdit={() => openEdit(faq)}
                onDelete={() => handleDelete(faq.id)}
              />
            </div>
          </div>
        ))}

        <button
          onClick={openAdd}
          className="bg-purple-700 px-4 py-2 rounded-lg"
        >
          + Tambah FAQ
        </button>
      </div>

      {/* ================= MODAL ================= */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit FAQ' : 'Tambah FAQ'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm">Pertanyaan</label>
            <input
              type="text"
              name="question"
              value={form.question}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded text-[#ffffff] bg-gray-800 border border-gray-700"
              required
            />
          </div>

          <div>
            <label className="text-sm">Jawaban</label>
            <textarea
              name="answer"
              value={form.answer}
              onChange={handleChange}
              rows={4}
              className="w-full mt-1 p-2 rounded text-[#ffffff] bg-gray-800 border border-gray-700"
              required
            />
          </div>

          <div>
            <label className="text-sm">Urutan (Sort Order)</label>
            <input
              type="number"
              name="sort_order"
              value={form.sort_order}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded text-[#ffffff] bg-gray-800 border border-gray-700"
              min="1"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            <label>Aktif</label>
          </div>

          <button
            type="submit"
            className="bg-purple-700 px-4 py-2 rounded-lg w-full"
          >
            Simpan
          </button>
        </form>
      </Modal>
    </SectionCard>
  )
}