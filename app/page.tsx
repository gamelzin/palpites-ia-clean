"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [telefoneConfirm, setTelefoneConfirm] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfConfirm, setCpfConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(null);
  const [pulse, setPulse] = useState(false);
  const [shake, setShake] = useState(false);
  const [leadSalvo, setLeadSalvo] = useState(false);
  const [botaoClicado, setBotaoClicado] = useState(false);
  const planosRef = useRef(null);
  const leadJaSalvo = useRef(false);

  // ✅ Validação CPF
  function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    return true;
  }

  // ✅ Máscaras
  const formatarCPF = (valor) =>
    valor
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);

  const formatarTelefone = (valor) =>
    valor
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "$1 $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2")
      .slice(0, 13);

  // 💫 Animações
  const scrollToEl = (el) => {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("highlight-pulse");
    setTimeout(() => el.classList.remove("highlight-pulse"), 2000);
  };

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
        body: JSON.stringify({ nome, email, telefone, cpf, plano: "futebol" }),
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
    setTimeout(() => setBotaoClicado(false), 300);
    if (!nome || !email || !telefone || !telefoneConfirm || !cpf || !cpfConfirm) {
      alert("Por favor, preencha todos os campos antes de continuar.");
      return;
    }
    if (telefone !== telefoneConfirm) return alert("Os números de WhatsApp não coincidem.");
    if (cpf !== cpfConfirm) return alert("Os CPFs não coincidem.");
    if (!validarCPF(cpf)) return alert("CPF inválido. Verifique e tente novamente.");

    setLoading(true);
    await salvarLead();
    setTimeout(() => {
      scrollToEl(planosRef.current);
      setLoading(false);
    }, 800);
  }

  async function handleCheckout(plan) {
    if (!nome || !email || !telefone || !cpf)
      return alert("Preencha nome, e-mail, WhatsApp e CPF antes de escolher um plano.");
    if (!validarCPF(cpf)) return alert("CPF inválido. Corrija antes de prosseguir.");

    try {
      setLoadingCheckout(plan);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, nome_cliente: nome, email_cliente: email, telefone, cpf }),
      });
      const data = await res.json();
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
          <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full p-3 border rounded-lg" required />
          <input type="email" placeholder="Seu melhor e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
          <input type="tel" placeholder="WhatsApp (com DDD)" value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} className="w-full p-3 border rounded-lg" required />
          <input type="tel" placeholder="Confirme seu WhatsApp" value={telefoneConfirm} onChange={(e) => setTelefoneConfirm(formatarTelefone(e.target.value))} className="w-full p-3 border rounded-lg" required />
          <input type="text" placeholder="CPF (somente números)" value={cpf} onChange={(e) => setCpf(formatarCPF(e.target.value))} className="w-full p-3 border rounded-lg" required />
          <input type="text" placeholder="Confirme seu CPF" value={cpfConfirm} onChange={(e) => setCpfConfirm(formatarCPF(e.target.value))} className="w-full p-3 border rounded-lg" required />
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={scrollToPlanos}
              disabled={loading}
              className={`flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform ${
                pulse ? "scale-105 opacity-90 shadow-lg" : "scale-100 opacity-100"
              } ${botaoClicado ? "bg-green-700 scale-95" : "hover:bg-green-700"} ${shake ? "animate-shake" : ""}`}
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

      {/* 📲 Preview das mensagens */}
      <section className="bg-gray-50 py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Veja como nossos assinantes recebem os palpites 💬</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-3">
          Todos os dias às <strong>07h da manhã</strong>, nossos assinantes recebem análises detalhadas e palpites seguros diretamente no WhatsApp.
        </p>
        <p className="text-sm text-gray-500 italic mb-8">
          Exemplos reais das mensagens enviadas diariamente aos assinantes.
        </p>

        <div className="flex flex-col lg:flex-row justify-center items-stretch gap-8 max-w-6xl mx-auto">
          {/* ⚽ Futebol */}
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
            className="flex-1 bg-[#e5ddd5] rounded-2xl shadow-xl p-4 border border-gray-300 text-sm">
            <div className="bg-[#dcf8c6] text-left p-4 rounded-lg text-gray-900 font-medium leading-relaxed shadow-sm">
              💚 <strong>PALPITES.IA — PALPITES DO DIA</strong><br />
              📅 Quinta-feira, 24 de Outubro de 2025 | ⏰ 07:00<br /><br />
              🏆 Premier League<br />⚔️ Arsenal 🆚 Chelsea — 16:30<br /><br />
              💡 <strong>PALPITES SEGUROS:</strong><br /><br />
              1️⃣ <strong>Mais de 1.5 gols ⚽ — Odd 1.42</strong><br />
              🧠 Motivo: Ambos têm ataques fortes e defesas vulneráveis.<br /><br />
              2️⃣ <strong>Ambas equipes marcam — Odd 1.67</strong><br />
              🧠 Motivo: 4 dos últimos 5 confrontos diretos tiveram gols.<br /><br />
              3️⃣ <strong>Mais de 8.5 escanteios 🔺 — Odd 1.72</strong><br />
              🧠 Motivo: Arsenal força muito pelas alas; alta média de escanteios.<br /><br />
              📈 <strong>Dados médios:</strong><br />
              🎯 Finalizações: 14.3 x 11.8<br />🔺 Escanteios: 6.5 x 5.7<br />🟨🟥 Cartões (H2H): 4.2<br /><br />
              ──────────────────────────────<br /><br />
              ⚠️ <strong>Importante:</strong><br />
              🚫 Não combine todos os palpites em um único bilhete.<br />
              ✅ Façam simples ou duplas seguras e use gestão de banca.<br /><br />
              📈 Inteligência, estatística e performance — isso é <strong>PALPITES.IA 💚</strong>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-right pr-2">07:00 ✔✔</div>
          </motion.div>

          {/* 🏀 Basquete */}
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }}
            className="flex-1 bg-[#e5ddd5] rounded-2xl shadow-xl p-4 border border-gray-300 text-sm">
            <div className="bg-[#dcf8c6] text-left p-4 rounded-lg text-gray-900 font-medium leading-relaxed shadow-sm">
              🏀 <strong>PALPITES.IA — NBA COMBO</strong><br />
              📅 Quinta-feira, 24 de Outubro de 2025 | ⏰ 07:00<br /><br />
              🏆 NBA<br />⚔️ Lakers 🆚 Celtics — 22:30<br /><br />
              💡 <strong>PALPITES SEGUROS:</strong><br /><br />
              1️⃣ <strong>Vitória do Lakers 🏠 — Odd 1.60</strong><br />
              🧠 Motivo: Elenco completo e sequência positiva em casa.<br /><br />
              2️⃣ <strong>Mais de 215.5 pontos totais 🔥 — Odd 1.72</strong><br />
              🧠 Motivo: Ambas equipes têm alta média ofensiva.<br /><br />
              📈 <strong>Dados médios:</strong><br />
              🎯 Pontos por jogo: 118.6 x 116.2<br />💪 Rebotes: 52 x 49<br /><br />
              ──────────────────────────────<br /><br />
              ⚠️ <strong>Importante:</strong><br />
              ✅ Façam simples ou duplas seguras e use gestão de banca.<br /><br />
              🏆 Estatísticas e precisão — isso é <strong>PALPITES.IA COMBO 💚</strong>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-right pr-2">07:00 ✔✔</div>
          </motion.div>
        </div>

        {/* 🔘 Botão principal */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} viewport={{ once: true }}
          className="flex justify-center mt-10">
          <a href="#planos" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition">
            💸 Ver Planos Disponíveis
          </a>
        </motion.div>
      </section>

      {/* 💸 Planos */}
      <section ref={planosRef} id="planos" className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* ⚽ Futebol */}
        <div className="p-8 border rounded-2xl shadow-lg bg-white text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">⚽ Futebol</h2>
          {["Mensal - R$49,90", "Trimestral - R$129,90", "Anual - R$419,90"].map((label, i) => {
            const planKey = ["football_monthly", "football_quarterly", "football_yearly"][i];
            return (
              <button key={planKey} onClick={() => handleCheckout(planKey)} disabled={loadingCheckout === planKey}
                className={`w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold mb-3 transition-all duration-200 ${
                  loadingCheckout === planKey ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
                }`}>
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
          })}
        </div>

        {/* ⚽🏀 Combo */}
        <div className="p-8 border rounded-2xl shadow-lg bg-white text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">⚽🏀 Futebol + Basquete</h2>
          {["Mensal - R$79,90", "Trimestral - R$159,90", "Anual - R$599,90"].map((label, i) => {
            const planKey = ["combo_monthly", "combo_quarterly", "combo_yearly"][i];
            return (
              <button key={planKey} onClick={() => handleCheckout(planKey)} disabled={loadingCheckout === planKey}
                className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold mb-3 transition-all duration-200 ${
                  loadingCheckout === planKey ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
                }`}>
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
          })}
        </div>
      </section>

      {/* ⚠️ Rodapé */}
      <footer className="bg-gray-900 text-gray-400 text-center py-8 mt-16 text-sm">
        <p>⚠️ Uso exclusivo para maiores de <strong>18 anos</strong>.</p>
        <p>Lembre-se: sempre utilize sua <strong>gestão de banca</strong>.</p>
        <p>Os palpites fornecidos não garantem ganhos financeiros. Aposte com responsabilidade.</p>
        <div className="mt-6 space-y-3">
          <a href="https://wa.me/556195082702?text=Ol%C3%A1!%20Quero%20suporte%20sobre%20minha%20assinatura%20👋"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg font-medium transition-transform hover:scale-105">
            💬 Fale conosco no WhatsApp
          </a>
          <p>
            Ou envie um e-mail para{" "}
            <a href="mailto:contato@palpitesia.com.br" className="text-green-400 underline">
              contato@palpitesia.com.br
            </a>
          </p>
        </div>
      </footer>

      {/* ✨ Estilos */}
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

        @keyframes highlight {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50% { box-shadow: 0 0 25px 5px rgba(34,197,94,0.8); }
        }
        .highlight-pulse { animation: highlight 2s ease-in-out; border-color: #22c55e !important; }
      `}</style>
    </main>
  );
}
