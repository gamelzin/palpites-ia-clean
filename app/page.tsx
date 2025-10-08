"use client"

import { useState, useRef, useEffect } from "react"

export default function Home() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [loading, setLoading] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [shake, setShake] = useState(false)

  const planosRef = useRef<HTMLDivElement | null>(null)

  // Pulso + fade suave a cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => !prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Vibração curta quando o usuário termina de digitar o WhatsApp
  useEffect(() => {
    if (telefone.length >= 10) {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 500) // 0.5s de shake
      return () => clearTimeout(timer)
    }
  }, [telefone])

  async function handleCheckout(plan: string) {
    try {
      setLoading(true)

      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, telefone }),
      })

      const resCheckout = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          whatsapp_number: telefone,
        }),
      })

      const data = await resCheckout.json()
      if (data.url) window.location.href = data.url
      else alert("Erro ao redirecionar para o checkout")
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao processar assinatura")
    } finally {
      setLoading(false)
    }
  }

  function scrollToPlanos() {
    planosRef.current?.scrollIntoView({ behavior: "smooth" })
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

          {/* Texto dinâmico e botão animado */}
          <div className="pt-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              {nome
                ? `Perfeito, ${nome.split(" ")[0]}! Agora escolha seu plano 👇`
                : "Preencha seus dados e veja qual plano combina mais com você 👇"}
            </p>
            <button
              type="button"
              onClick={scrollToPlanos}
              className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-full shadow-md transition duration-500 ease-in-out ${
                pulse ? "scale-105 opacity-90 shadow-lg" : "scale-100 opacity-100"
              } ${shake ? "animate-shake" : ""}`}
            >
              Quero escolher meu plano 🔥
            </button>
          </div>
        </form>
      </section>

      {/* Planos */}
      <section
        ref={planosRef}
        id="planos"
        className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {/* Futebol */}
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

        {/* Combo */}
        <div className="p-8 border rounded-2xl shadow-lg bg-white text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            ⚽🏀 Futebol + Basquete
          </h2>
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
        <p className="mb-2">
          ⚠️ Uso exclusivo para maiores de <strong>18 anos</strong>.
        </p>
        <p className="mb-2">
          Lembre-se: sempre utilize sua <strong>gestão de banca</strong>.
        </p>
        <p>
          Os palpites fornecidos não garantem ganhos financeiros. Aposte com
          responsabilidade.
        </p>
      </footer>

      {/* Animação personalizada para o shake */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </main>
  )
}
