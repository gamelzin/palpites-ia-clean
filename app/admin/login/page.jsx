'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminLoginContent() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get('next') || '/admin'

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha no login')
      router.replace(next)
      router.refresh()
    } catch (err) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-100 p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 shadow-xl"
      >
        <h1 className="text-2xl font-semibold mb-2">Painel Admin</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Acesso restrito. Informe a senha de administrador.
        </p>
        <label className="block text-sm mb-2">Senha</label>
        <input
          type="password"
          className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 outline-none focus:ring-2 focus:ring-white/10"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-white/90 text-neutral-900 font-medium py-2 hover:bg-white transition disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-neutral-400 mt-20">Carregando...</div>}>
      <AdminLoginContent />
    </Suspense>
  )
}
