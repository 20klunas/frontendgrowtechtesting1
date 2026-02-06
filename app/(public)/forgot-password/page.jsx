'use client'

import { useState } from "react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/password/forgot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Gagal")
      }

      setSuccess(true)
    } catch (err) {
      alert(err.message || "Gagal mengirim email reset password")
    } finally {
      setLoading(false)
    }
  }


  return (
    <main
      className="
        min-h-[calc(100vh-80px)]
        flex items-center justify-center
        px-4 pt-16
      "
    >
      <div
        className="
          w-full max-w-md
          rounded-2xl
          border border-purple-400/60
          bg-black
          p-8
        "
      >
        <h1 className="text-center text-2xl font-semibold text-purple-300 mb-2">
          Lupa Password
        </h1>

        <p className="mb-6 text-center text-sm text-gray-400">
          Masukkan email akunmu, kami akan mengirim link reset password
        </p>

        {success ? (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-center text-sm text-green-400">
            Link reset password telah dikirim ke email kamu.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-purple-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="growtech@email.com"
                required
                className="
                  mt-1 w-full rounded-lg
                  border border-purple-400/50
                  bg-black
                  px-4 py-2
                  text-white
                  outline-none
                  focus:border-purple-500
                "
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                mt-4 w-full
                rounded-xl
                bg-[#2B044D]
                py-3
                font-semibold
                text-white
                transition
                hover:bg-[#3a0a6a]
                disabled:opacity-50
              "
            >
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-400">
          <a href="/login" className="text-purple-400 hover:underline">
            ← Kembali ke Login
          </a>
        </p>
      </div>
    </main>
  )
}
