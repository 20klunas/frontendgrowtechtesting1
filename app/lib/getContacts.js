// lib/getContacts.js

export async function getContacts() {
  const API = process.env.NEXT_PUBLIC_API_URL

  if (!API) {
    console.error('API URL tidak ditemukan')
    return []
  }

  try {
    const res = await fetch(`${API}/api/v1/content/settings?group=contact`, {
    //   next: { revalidate: 30 }, // cache 1 jam
      // cache: 'force-cache', // cache tanpa kadaluarsa (manual purge)
      cache: 'no-store', // tidak menggunakan cache
      // next: { revalidate: 60 }, // kalau mau cache 1 menit
    })

    if (!res.ok) {
      throw new Error('Gagal fetch kontak')
    }

    const json = await res.json()

    return json?.data || []
  } catch (err) {
    console.error('Error getContacts:', err)
    return []
  }
}