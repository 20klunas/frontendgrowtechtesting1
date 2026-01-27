'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import SectionCard from '../../../components/admin/SectionCard'
import Modal from '../../../components/ui/Modal'

const API = process.env.NEXT_PUBLIC_API_URL

const CONTACT_TYPES = [
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Email', value: 'email' },
  { label: 'Discord', value: 'discord' },
  { label: 'Instagram', value: 'instagram' },
]

export default function KontakPage() {
  const [contacts, setContacts] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const [type, setType] = useState('whatsapp')
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [display, setDisplay] = useState('')
  const [iconFile, setIconFile] = useState(null)
  const [iconPath, setIconPath] = useState('')
  const [iconUrl, setIconUrl] = useState('')

  /* ================= LOAD DATA ================= */
  const loadContacts = async () => {
    const token = Cookies.get('token')

    const res = await fetch(`${API}/api/v1/admin/settings?group=contact`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const json = await res.json()
    setContacts(json.data || [])
  }

  useEffect(() => {
    loadContacts()
  }, [])

  /* ================= ICON UPLOAD ================= */
  const uploadIcon = async () => {
    if (!iconFile) return { path: iconPath, url: iconUrl }

    const token = Cookies.get('token')

    const signRes = await fetch(`${API}/api/v1/admin/settings/icon/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mime: iconFile.type }),
    })

    const signData = await signRes.json()

    await fetch(signData.data.signed_url, {
      method: 'PUT',
      headers: { 'Content-Type': iconFile.type },
      body: iconFile,
    })

    return {
      path: signData.data.path,
      url: signData.data.public_url,
    }
  }

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    const token = Cookies.get('token')

    if (!editing && !iconFile) {
      alert("Icon wajib diupload")
      return
    }

    const uploaded = await uploadIcon()

    const res = await fetch(`${API}/api/v1/admin/settings/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        group: 'contact',
        key: type,
        is_public: true,
        value: {
          name,
          link,
          display,
          icon_path: uploaded.path,
          icon_url: uploaded.url,
        },
      }),
    })

    console.log("UPSERT STATUS:", res.status)

    if (!res.ok) {
      const err = await res.text()
      console.log("ERROR BODY:", err)
      alert("Gagal simpan, cek console")
      return
    }

    resetModal()
    loadContacts()
  }



    resetModal()
    loadContacts()
  }

  /* ================= DELETE ================= */
  const handleDelete = async (key) => {
    if (!confirm('Hapus kontak ini?')) return

    const token = Cookies.get('token')

    await fetch(`${API}/api/v1/admin/settings`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        group: 'contact',
        key,
      }),
    })

    loadContacts()
  }

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setEditing(item)
    setType(item.key)
    setName(item.value.name)
    setLink(item.value.link)
    setDisplay(item.value.display || '')
    setIconPath(item.value.icon_path)
    setIconUrl(item.value.icon_url)
    setModalOpen(true)
  }

  const resetModal = () => {
    setModalOpen(false)
    setEditing(null)
    setType('whatsapp')
    setName('')
    setLink('')
    setDisplay('')
    setIconFile(null)
    setIconPath('')
    setIconUrl('')
  }

  return (
    <>
      <SectionCard title="Kelola Kontak">
        <div className="space-y-4">
          <button
            onClick={() => setModalOpen(true)}
            className="bg-purple-700 px-4 py-2 rounded-lg w-fit"
          >
            + Tambah Kontak
          </button>

          {contacts.map((item) => (
            <div
              key={item.key}
              className="border border-purple-700 rounded-xl p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.value.icon_url}
                  className="w-8 h-8 object-contain"
                  alt={item.value.name}
                />
                <div>
                  <div className="font-semibold">{item.value.name}</div>
                  <div className="text-sm text-gray-400">{item.value.display}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="bg-orange-500 p-2 rounded-lg"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(item.key)}
                  className="bg-red-600 p-2 rounded-lg"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ================= MODAL ================= */}
      <Modal
        open={modalOpen}
        onClose={resetModal}
        title={editing ? 'Edit Kontak' : 'Tambah Kontak'}
      >
        <div className="space-y-4">
          {/* TYPE */}
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={editing} // key tidak boleh diganti saat edit
          >
            {CONTACT_TYPES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* NAME */}
          <input
            className="input"
            placeholder="Nama Kontak (contoh: Discord)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* LINK */}
          <input
            className="input"
            placeholder="Link URL (https://...)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />

          {/* DISPLAY */}
          <input
            className="input"
            placeholder="Teks Display (discord.gg/xxxx)"
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
          />

          {/* ICON */}
          <div className="space-y-2">
            {iconUrl && (
              <img src={iconUrl} className="w-12 h-12 object-contain rounded" />
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIconFile(e.target.files[0])}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="bg-green-500 text-black px-6 py-2 rounded-lg w-full"
          >

            {editing ? 'Simpan Perubahan' : 'Tambah'}
          </button>
        </div>
      </Modal>
    </>
  )
}
