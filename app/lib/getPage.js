// lib/getPage.js

export async function getPage(slug) {
  const API = process.env.NEXT_PUBLIC_API_URL

  if (!API) {
    console.error('API URL tidak ditemukan')
    return null
  }

  try {
    const res = await fetch(`${API}/api/v1/content/pages/${slug}`, {
      // pilih salah satu strategi
    //   next: { revalidate: 30 }, // cache 1 jam
      // cache: 'force-cache', // cache tanpa kadaluarsa (manual purge)
      cache: 'no-store', // tidak menggunakan cache
      // next: { revalidate: 60 }, // kalau mau cache 1 menit
    })

    if (!res.ok) {
      throw new Error('Gagal fetch halaman')
    }

    const data = await res.json()

    return data?.data || data || null
  } catch (err) {
    console.error(`Error getPage (${slug}):`, err)
    return null
  }
}