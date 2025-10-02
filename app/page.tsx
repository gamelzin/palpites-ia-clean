"use client"

import { useState } from "react"

export default function Home() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCheckout(plan: string) {
    try {
      setLoading(true)

      // 1. Salva o lead no Supabase via API
      const resLead = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, telefone }),
      })

      if (!resLead.ok) throw new Error("Erro ao salvar lead")

      // 2. Só depois abre o checkout no Stripe
      const resCheckout = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      const data = await resCheckout.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Erro ao redirecionar para o checkout")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao processar assinatura")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero + Formulário */}
      <section className="flex flex-col items-center text-center px-6 py-24 bg-gradient-to-r from-green-600 to-emerald-500 text-white">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-lg">
          Receba palpites de Futebol e Basquete direto no WhatsApp 📲
        </h1>

        <form className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-gray-800 space-y-4">
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
          <input
            type="tel"
            placeholder="WhatsApp (com DDD)"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
        </form>
      </section>

      {/* Planos */}
      <section className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Futebol Mensal */}
        <div className="p-8 border rounded-2xl shadow-lg bg-white text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">⚽ Futebol</h2>
          <button
            onClick={() => handleCheckout("football_monthly")}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold mb-3"
          >
            Mensal - R$49,90
          </button>
          <button
            onClick={() => handleCheckout("football_quarterly")}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold mb-3"
          >
            Trimestral - R$129,90
          </button>
          <button
            onClick={() => handleCheckout("football_yearly")}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Anual - R$419,90
          </button>
        </div>

        {/* Combo Mensal/Trimestral/Anual */}
        <div className="p-8 border rounded-2xl shadow-lg bg-white text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">⚽🏀 Futebol + Basquete</h2>
          <button
            onClick={() => handleCheckout("combo_monthly")}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold mb-3"
          >
            Mensal - R$79,90
          </button>
          <button
            onClick={() => handleCheckout("combo_quarterly")}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold mb-3"
          >
            Trimestral - R$159,90
          </button>
          <button
            onClick={() => handleCheckout("combo_yearly")}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Anual - R$599,90
          </button>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 mt-16 text-sm">
        <p className="mb-2">⚠️ Uso exclusivo para maiores de <strong>18 anos</strong>.</p>
        <p className="mb-2">
          Lembre-se: sempre utilize sua <strong>gestão de banca</strong>.
        </p>
        <p>
          Os palpites fornecidos não garantem ganhos financeiros. Aposte com
          responsabilidade.
        </p>
      </footer>
    </main>
  )
}
