// lib/getFaqs.js

export async function getFaqs() {
  const API = process.env.NEXT_PUBLIC_API_URL

  if (!API) {
    console.error('API URL tidak ditemukan')
    return []
  }

  try {
    const res = await fetch(`${API}/api/v1/content/faqs`, {
      // pilih salah satu:
    //   next: { revalidate: 30 }, // cache 1 jam
      // cache: 'force-cache', // cache tanpa kadaluarsa (manual purge)
      cache: 'no-store', // tidak menggunakan cache
      // next: { revalidate: 60 }, // kalau mau cache 1 menit
    })

    if (!res.ok) {
      throw new Error('Gagal fetch FAQ')
    }

    const data = await res.json()

    let list = data?.data || data || []

    return list
      .filter((f) => f.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  } catch (err) {
    console.error('Error getFaqs:', err)
    return []
  }
}