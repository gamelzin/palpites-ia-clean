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

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (telefone.length >= 10) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [telefone]);

  useEffect(() => {
    if (leadJaSalvo.current) return;
    if (nome && email && telefone.length >= 10) {
      leadJaSalvo.current = true;
      salvarLead(true);
    }
  }, [nome, email, telefone]);

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

  async function scrollToPlanos() {
    setBotaoClicado(true);
    setTimeout(() => setBotaoClicado(false), 200);

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

  async function handleCheckout(plan: string) {
    if (!nome || !email || !telefone || !telefoneConfirm) {
      alert("Preencha seu nome, e-mail e WhatsApp (confirmado) antes de escolher um plano.");
      return;
    }

    if (telefone !== telefoneConfirm) {
      alert("Os números de WhatsApp não coincidem.");
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
      alert("Erro ao processar pagamento");
    } finally {
      setLoadingCheckout(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* ================= HERO ================= */}
      <section className="px-6 py-16 md:py-24 bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-xl text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight max-w-4xl mx-auto">
          Inteligência Artificial que envia <span className="text-yellow-300">palpites inteligentes</span> para você no WhatsApp 📲
        </h1>

        <p className="mt-6 text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
          Estatísticas oficiais, análise de desempenho e leitura avançada de partidas — tudo entregue automaticamente às 07h da manhã.
        </p>

        {leadSalvo && (
          <div className="mt-6 inline-flex bg-white text-green-700 font-semibold py-2 px-5 rounded-full shadow-lg animate-fade-in-out">
            ✅ Seus dados foram salvos! Agora escolha um plano abaixo 👇
          </div>
        )}

        {/* FORMULÁRIO */}
        <div className="bg-white mt-10 p-6 md:p-7 rounded-2xl shadow-2xl max-w-md mx-auto text-gray-800 border border-gray-200">
          <h2 className="text-2xl font-bold mb-2 text-center">Comece agora ⚡</h2>
          <p className="text-sm text-center mb-4 text-gray-500">
            Preencha seus dados e escolha o plano. Você recebe tudo no WhatsApp.
          </p>

          <form className="space-y-4">
            <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full p-3 border rounded-lg" />

            <input type="email" placeholder="Seu melhor e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" />

            <input type="tel" placeholder="WhatsApp (com DDD)" value={telefone} onChange={(e) => setTelefone(e.target.value)} className={`w-full p-3 border rounded-lg ${shake ? "animate-shake" : ""}`} />

            <input type="tel" placeholder="Confirme seu WhatsApp" value={telefoneConfirm} onChange={(e) => setTelefoneConfirm(e.target.value)} className="w-full p-3 border rounded-lg" />

            <button type="button" onClick={scrollToPlanos} disabled={loading} className={`w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold mt-3 transition-all ${pulse ? "scale-105" : "scale-100"}`}>
              {loading ? "Salvando..." : "Quero escolher meu plano 🔥"}
            </button>
          </form>
        </div>
      </section>

      {/* ================= EXEMPLO MENSAGENS ================= */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">
          Como chegam as mensagens no seu WhatsApp 📩
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* FUTEBOL */}
          <div className="bg-[#E9F7EF] p-6 border border-green-300 rounded-2xl shadow whitespace-pre-line text-sm leading-relaxed">
{`💚 PALPITES.IA — FUTEBOL
📅 Quinta, 06/11/2025 — 07:00

🏆 Premier League
Arsenal vs Chelsea — 16:30

1️⃣ +7.5 escanteios  
2️⃣ Ambas marcam  
3️⃣ +3.5 cartões  

⚠️ Gestão de banca sempre.`}
          </div>

          {/* COMBO */}
          <div className="bg-[#ECF2FF] p-6 border border-blue-300 rounded-2xl shadow whitespace-pre-line text-sm leading-relaxed">
{`💙 PALPITES.IA — COMBO FUT + BASQ
📅 Quinta, 06/11/2025 — 07:00

🏀 Lakers vs Nuggets  
1️⃣ +205 pontos  
2️⃣ +3.5 cartões (futebol)  
3️⃣ Ambas marcam — Odd 1.64  

⚠️ Plano ideal para volume maior.`}
          </div>
        </div>
      </section>

      {/* ================= PLANOS ================= */}
      <section ref={planosRef} id="planos" className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

        {/* FUTEBOL */}
        <div className="p-8 border rounded-2xl shadow hover:shadow-xl transition bg-white text-center">
          <h3 className="text-2xl font-bold mb-4">⚽ Futebol</h3>

          {["Mensal - R$49,90","Trimestral - R$129,90","Anual - R$419,90"].map((label, i) => {
            const key = ["football_monthly","football_quarterly","football_yearly"][i];
            return (
              <button key={key} disabled={loadingCheckout === key} onClick={() => handleCheckout(key)} className={`w-full py-3 mt-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition ${loadingCheckout === key && "opacity-70"}`}>
                {loadingCheckout === key ? "Redirecionando..." : label}
              </button>
            );
          })}
        </div>

        {/* COMBO */}
        <div className="p-8 border rounded-2xl shadow hover:shadow-xl transition bg-white text-center">
          <h3 className="text-2xl font-bold mb-4">⚽🏀 Combo Fut + Basquete</h3>

          {["Mensal - R$79,90","Trimestral - R$159,90","Anual - R$599,90"].map((label, i) => {
            const key = ["combo_monthly","combo_quarterly","combo_yearly"][i];
            return (
              <button key={key} disabled={loadingCheckout === key} onClick={() => handleCheckout(key)} className={`w-full py-3 mt-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition ${loadingCheckout === key && "opacity-70"}`}>
                {loadingCheckout === key ? "Redirecionando..." : label}
              </button>
            );
          })}
        </div>

        {/* GARANTIA / INFO */}
        <div className="p-8 bg-gray-900 text-gray-100 rounded-2xl shadow flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-3">📌 Importante</h3>
            <ul className="space-y-2 text-sm">
              <li>• Apenas para maiores de 18 anos.</li>
              <li>• Não existe lucro garantido.</li>
              <li>• IA auxilia, você sempre decide.</li>
              <li>• Gestão de banca é fundamental.</li>
            </ul>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            Nada aqui é recomendação financeira. Aposte com responsabilidade.
          </p>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">
          Dúvidas frequentes ❓
        </h2>

        <div className="space-y-4">

          <div className="bg-white p-5 rounded-2xl shadow border border-gray-200">
            <h3 className="font-semibold mb-1">📲 Em qual horário recebo os palpites?</h3>
            <p className="text-gray-600">
              Todos os dias às <strong>07h</strong>, direto no seu WhatsApp.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow border border-gray-200">
            <h3 className="font-semibold mb-1">🔁 Se eu assinar depois das 07h?</h3>
            <p className="text-gray-600">
              Sim! Nossa estrutura aceita novos assinantes a qualquer hora.  
              Assim que seu número entra na base, você recebe automaticamente nossa mensagem de boas-vindas — basta responder <strong>“SIM”</strong> para liberar o envio imediato dos palpites do dia.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow border border-gray-200">
            <h3 className="font-semibold mb-1">🧠 A IA garante lucro?</h3>
            <p className="text-gray-600">
              Não. A IA mostra cenários estatisticamente interessantes, mas risco sempre existe. Use gestão de banca.
            </p>
          </div>

        </div>
      </section>

      {/* ================= RODAPÉ ================= */}
      <footer className="bg-gray-900 text-gray-400 text-center py-10 text-sm">
        <p>⚠️ Uso exclusivo para maiores de 18 anos. Aposte com responsabilidade.</p>
        <p className="mt-2">
          Suporte somente por e-mail:{" "}
          <a href="mailto:contato@palpitesia.com.br" className="text-green-400 underline">
            contato@palpitesia.com.br
          </a>
        </p>
      </footer>
    </main>
  );
}
