'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

export default function ContactPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await fetch(`${API}/api/v1/content/settings?group=contact`)
        const json = await res.json()
        setContacts(json.data || [])
      } catch (err) {
        console.error('Gagal load kontak:', err)
      } finally {
        setLoading(false)
      }
    }

    loadContacts()
  }, [])

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold text-center mb-4">Hubungi Kami</h1>
      <p className="text-center text-gray-400 mb-16">Kami siap membantu Anda 24/7</p>

      {loading ? (
        <p className="text-center text-gray-400">Loading kontak...</p>
      ) : contacts.length === 0 ? (
        <p className="text-center text-gray-500">Belum ada kontak tersedia</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {contacts.map((item) => (
            <a
              key={item.key}
              href={item.value.link}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-purple-700 rounded-2xl p-8 flex justify-between items-center hover:bg-purple-900/20 transition"
            >
              <div>
                <h3 className="text-xl font-semibold mb-2">{item.value.name}</h3>
                <p className="text-lg text-gray-300">{item.value.display}</p>
              </div>

              <img
                src={item.value.icon_url}
                alt={item.value.name}
                className="w-12 h-12 object-contain"
              />
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
