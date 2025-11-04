'use client'
import { useState } from 'react'

export default function LeadForm() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [plano, setPlano] = useState('futebol')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMensagem('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone, plano }),
      })

      const data = await res.json()

      if (res.ok) {
        setMensagem('✅ Lead salvo com sucesso! Em breve você receberá novidades.')
        setNome('')
        setEmail('')
        setTelefone('')
        setPlano('futebol')
      } else {
        console.error('Erro ao salvar lead:', data)
        setMensagem('❌ Erro ao salvar lead. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro geral:', err)
      setMensagem('❌ Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-100 space-y-4"
    >
      <h2 className="text-lg font-semibold text-center mb-2">Cadastre-se para receber os palpites</h2>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-green-500 outline-none"
        />

        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-green-500 outline-none"
        />

        <input
          type="tel"
          placeholder="Seu número (WhatsApp)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          required
          className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-green-500 outline-none"
        />

        <select
          value={plano}
          onChange={(e) => setPlano(e.target.value)}
          className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-green-500 outline-none"
        >
          <option value="futebol">Futebol</option>
          <option value="combo">Combo (Futebol + Basquete)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 mt-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium transition"
      >
        {loading ? 'Enviando...' : 'Quero Receber os Palpites'}
      </button>

      {mensagem && (
        <p
          className={`text-sm mt-3 text-center ${
            mensagem.startsWith('✅') ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {mensagem}
        </p>
      )}
    </form>
  )
}
