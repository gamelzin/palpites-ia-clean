"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [telefoneConfirm, setTelefoneConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [shake, setShake] = useState(false);
  const [leadSalvo, setLeadSalvo] = useState(false);
  const [botaoClicado, setBotaoClicado] = useState(false);
  const planosRef = useRef<HTMLDivElement | null>(null);
  const leadJaSalvo = useRef(false);

  // 🔁 Pulso suave
  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 3000);
    return () => clearInterval(interval);
  }, []);

  // 💫 Vibração curta ao digitar telefone
  useEffect(() => {
    if (telefone.length >= 10) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [telefone]);

  // 💾 Auto-salvar lead quando campos estão completos
  useEffect(() => {
    if (leadJaSalvo.current) return;
    if (nome && email && telefone.length >= 10) {
      leadJaSalvo.current = true;
      salvarLead(true);
    }
  }, [nome, email, telefone]);

  // 💾 Salva lead
  async function salvarLead(silencioso = false) {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_cliente: nome,
          email_cliente: email,
          telefone,
        }),
      });

      if (res.ok && !silencioso) {
        setLeadSalvo(true);
        setTimeout(() => setLeadSalvo(false), 4000);
      }
    } catch (err) {
      console.error("❌ Erro ao salvar lead:", err);
    }
  }

  // 🔽 Scroll até planos
  async function scrollToPlanos() {
    setBotaoClicado(true);
    setTimeout(() => setBotaoClicado(false), 300);

    if (!nome || !email || !telefone || !telefoneConfirm) {
      alert("Por favor, preencha todos os campos antes de continuar.");
      return;
    }
    if (telefone !== telefoneConfirm) {
      alert("Os números de WhatsApp não coincidem.");
      return;
    }

    setLoading(true);
    await salvarLead();
    setTimeout(() => {
      planosRef.current?.scrollIntoView({ behavior: "smooth" });
      setLoading(false);
    }, 800);
  }

  // ⚽🏀 Checkout
  async function handleCheckout(plan: string) {
    if (!nome || !email || !telefone) {
      alert("Preencha seu nome, e-mail e WhatsApp antes de escolher um plano.");
      return;
    }

    try {
      setLoadingCheckout(plan);
      const resCheckout = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          nome_cliente: nome,
          email_cliente: email,
          telefone,
        }),
      });

      const data = await resCheckout.json();
      if (data.url) window.location.href = data.url;
      else alert("Erro ao redirecionar para o checkout");
    } catch (err) {
      console.error(err);
      alert("Erro ao processar o checkout");
    } finally {
      setLoadingCheckout(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 🧭 Cabeçalho */}
      <section className="flex flex-col items-center text-center px-6 py-24 bg-gradient-to-r from-green-600 to-emerald-500 text-white relative">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-lg">
          Receba palpites de Futebol e Basquete direto no WhatsApp 📲
        </h1>

        {leadSalvo && (
          <div className="absolute top-10 bg-white text-green-700 font-semibold py-2 px-6 rounded-full shadow-lg animate-fade-in-out">
            ✅ Seus dados foram salvos! Escolha seu plano abaixo 👇
          </div>
        )}

        {/* 🧾 Formulário */}
        <form className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-gray-800 space-y-4 mt-4">
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
          <input
            type="tel"
            placeholder="Confirme seu WhatsApp"
            value={telefoneConfirm}
            onChange={(e) => setTelefoneConfirm(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />

          {/* Botão animado */}
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={scrollToPlanos}
              disabled={loading}
              className={`flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform ${
                pulse ? "scale-105 opacity-90 shadow-lg" : "scale-100 opacity-100"
              } ${
                botaoClicado ? "bg-green-700 scale-95" : "hover:bg-green-700"
              } ${shake ? "animate-shake" : ""}`}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Salvando dados...
                </>
              ) : (
                "Quero escolher meu plano 🔥"
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 💸 Planos */}
      <section
        ref={planosRef}
        id="planos"
        className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {/* ⚽ Futebol */}
        <div className="p-8 border rounded-2xl shadow-lg bg-white text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">⚽ Futebol</h2>
          {["Mensal - R$49,90", "Trimestral - R$129,90", "Anual - R$419,90"].map(
            (label, i) => {
              const planKey = ["football_monthly", "football_quarterly", "football_yearly"][i];
              return (
                <button
                  key={planKey}
                  onClick={() => handleCheckout(planKey)}
                  disabled={loadingCheckout === planKey}
                  className={`w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold mb-3 transition-all duration-200 ${
                    loadingCheckout === planKey ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
                  }`}
                >
                  {loadingCheckout === planKey ? (
                    <>
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                      Redirecionando...
                    </>
                  ) : (
                    label
                  )}
                </button>
              );
            }
          )}
        </div>

        {/* ⚽🏀 Combo */}
        <div className="p-8 border rounded-2xl shadow-lg bg-white text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            ⚽🏀 Futebol + Basquete
          </h2>
          {["Mensal - R$79,90", "Trimestral - R$159,90", "Anual - R$599,90"].map(
            (label, i) => {
              const planKey = ["combo_monthly", "combo_quarterly", "combo_yearly"][i];
              return (
                <button
                  key={planKey}
                  onClick={() => handleCheckout(planKey)}
                  disabled={loadingCheckout === planKey}
                  className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold mb-3 transition-all duration-200 ${
                    loadingCheckout === planKey ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
                  }`}
                >
                  {loadingCheckout === planKey ? (
                    <>
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                      Redirecionando...
                    </>
                  ) : (
                    label
                  )}
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* ⚠️ Rodapé */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 mt-16 text-sm">
        <p>⚠️ Uso exclusivo para maiores de <strong>18 anos</strong>.</p>
        <p>Lembre-se: sempre utilize sua <strong>gestão de banca</strong>.</p>
        <p>Os palpites fornecidos não garantem ganhos financeiros. Aposte com responsabilidade.</p>
      </footer>

      {/* ✨ Animações */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }

        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(-10px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fade-in-out { animation: fade-in-out 4s ease-in-out; }
      `}</style>
    </main>
  );
}
