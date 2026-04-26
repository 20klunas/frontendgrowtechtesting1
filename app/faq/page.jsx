// app/faq/page.jsx

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FAQList from '../components/FAQList'
import { getFaqs } from '../lib/getFaqs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FAQPage() {
  const faqs = await getFaqs()

  return (
    <>
      <Navbar />

      <section className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-center mb-3">
          Pertanyaan Umum (FAQ)
        </h1>

        <p className="text-center text-gray-400 mb-12">
          Temukan jawaban atas pertanyaan yang sering diajukan
        </p>

        <FAQList faqs={faqs} />
      </section>

      <Footer />
    </>
  )
}
