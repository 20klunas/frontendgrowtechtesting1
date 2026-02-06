'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const API = process.env.NEXT_PUBLIC_API_URL
  const sp = useSearchParams()
  const router = useRouter()

  const token = useMemo(() => sp.get('token') || '', [sp])
  const email = useMemo(() => sp.get('email') || '', [sp])

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    try {
      const res = await fetch(`${API}/api/v1/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message || 'Reset password gagal')

      setMsg(json?.data?.message || 'Password berhasil direset.')
      // arahkan login
      setTimeout(() => router.push('/login'), 800)
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div style={{ maxWidth: 420, margin: '40px auto' }}>
        <h1>Reset Password</h1>
        <p>Link reset tidak valid (token/email kosong).</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>Reset Password</h1>
      <p style={{ opacity: 0.8 }}>Untuk: {decodeURIComponent(email)}</p>

      <form onSubmit={submit}>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password baru"
          type="password"
          minLength={8}
          required
          style={{ width: '100%', padding: 12, marginTop: 12 }}
        />

        <input
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          placeholder="Konfirmasi password baru"
          type="password"
          minLength={8}
          required
          style={{ width: '100%', padding: 12, marginTop: 12 }}
        />

        <button disabled={loading} style={{ width: '100%', padding: 12, marginTop: 12 }}>
          {loading ? 'Memproses...' : 'Reset Password'}
        </button>
      </form>

      {msg && <p style={{ marginTop: 16 }}>{msg}</p>}
    </div>
  )
}