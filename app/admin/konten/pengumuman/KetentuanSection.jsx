'use client'

import { useEffect, useMemo, useState } from 'react'
import SectionCard from '../../../components/admin/SectionCard'
import Cookies from 'js-cookie'

export default function KetentuanSection() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const token = Cookies.get('token')
  const slug = 'ketentuan-layanan'
  const initialTitle = 'Ketentuan Layanan'

  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const previewHtml = useMemo(() => content || `<p class="text-gray-400">Preview ketentuan masih kosong.</p>`, [content])

  const fetchPage = async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/pages/slug/${slug}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      })

      const data = await res.json().catch(() => ({}))

      if (data?.data) {
        setTitle(data.data.title || initialTitle)
        setContent(data.data.content || '')
        setIsPublished(Boolean(data.data.is_published))
      }
    } catch (err) {
      console.error('Gagal ambil halaman', err)
      setMessage({ type: 'error', text: 'Gagal mengambil data halaman' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage()
  }, [API, token])

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const res = await fetch(`${API}/api/v1/admin/pages/slug/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
        body: JSON.stringify({
          title,
          content,
          is_published: isPublished,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        throw new Error(data?.error?.message || data?.message || 'Gagal menyimpan')
      }

      setMessage({ type: 'success', text: 'Perubahan berhasil disimpan' })
      await fetchPage()
    } catch (err) {
      console.error('Gagal simpan', err)
      setMessage({ type: 'error', text: err?.message || 'Gagal menyimpan' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SectionCard title={initialTitle}>Memuat...</SectionCard>

  return (
    <SectionCard title={initialTitle}>
      <input
        type="text"
        className="input mb-4"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul halaman"
      />

      <textarea
        rows={14}
        className="input font-mono text-sm"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="HTML diperbolehkan"
      />

      <div className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        <label>Publish halaman</label>
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/40 bg-red-500/10 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-lg bg-green-500 px-6 py-2 text-black disabled:opacity-60"
      >
        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>

      <div className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Preview</h3>
        <div
          className="prose prose-invert max-w-none rounded-2xl border border-purple-700/40 bg-black/40 p-5"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </SectionCard>
  )
}
