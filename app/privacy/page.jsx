// app/privacy/page.jsx

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getPage } from '../lib/getPage'

export default async function PrivacyPage() {
  const page = await getPage('privasi-kami')

  return (
    <>
      <Navbar />

      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="rounded-2xl border border-purple-700 p-10">
          {!page ? (
            <div className="text-center text-gray-400">
              Konten tidak ditemukan
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold bg-purple-900 rounded-xl py-6 text-center mb-10">
                {page.title}
              </h1>

              <div
                className="prose prose-invert max-w-none text-gray-200"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}