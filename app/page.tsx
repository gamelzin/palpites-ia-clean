"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

// 🧠 SEO CONFIGURAÇÃO
export const metadata = {
  title: "PALPITES.IA — Palpites Esportivos com Inteligência Artificial e Análise Estatística",
  description:
    "Receba palpites de Futebol e Basquete gerados por uma IA exclusiva da PALPITES.IA — baseada em estatísticas oficiais, desempenho recente e probabilidades seguras. Resultados com inteligência, estratégia e confiança.",
  openGraph: {
    title: "PALPITES.IA — IA que gera palpites com base em dados reais 📊",
    description:
      "Nossos palpites são criados por uma Inteligência Artificial exclusiva que analisa estatísticas, tendências e probabilidades reais para entregar resultados consistentes.",
    url: "https://palpitesia.com.br",
    siteName: "PALPITES.IA",
    images: [
      {
        url: "https://palpitesia.com.br/og-image.jpg", // ✅ imagem OG padrão
        width: 1200,
        height: 630,
        alt: "PALPITES.IA — IA de palpites esportivos",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PALPITES.IA — Inteligência, estratégia e performance ⚽🤖",
    description:
      "Palpites gerados por IA com base em estatísticas oficiais e desempenho real. Futebol e Basquete no WhatsApp todos os dias!",
    images: ["https://palpitesia.com.br/og-image.jpg"],
  },
};

export default function Home() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [telefoneConfirm, setTelefoneConfirm] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfConfirm, setCpfConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [shake, setShake] = useState(false);
  const [leadSalvo, setLeadSalvo] = useState(false);
  const [botaoClicado, setBotaoClicado] = useState(false);
  const planosRef = useRef<HTMLDivElement | null>(null);
  const leadJaSalvo = useRef(false);

  // ✅ Validação CPF
  function validarCPF(cpf: string) {
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
  const formatarCPF = (valor: string) =>
    valor
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);

  const formatarTelefone = (valor: string) =>
    valor
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "$1 $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2")
      .slice(0, 13);

  // 💫 Animações
  const scrollToEl = (el: HTMLElement | null) => {
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

  // ✅ Correção de tipagem
  async function handleCheckout(plan: string): Promise<void> {
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
        <img
          src="/og-image.jpg"
          alt="PALPITES.IA — IA de palpites esportivos"
          className="w-24 h-24 mb-4 rounded-full shadow-md border-2 border-white"
        />
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-lg">
          Receba palpites de Futebol e Basquete com precisão da IA PALPITES.IA ⚽🤖
          <br />
          <span className="text-xl md:text-2xl font-medium mt-3 block text-emerald-100">
            IA exclusiva que analisa estatísticas oficiais, desempenho recente e probabilidades seguras — resultados com estratégia e confiança.
          </span>
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
        </form>
      </section>
    </main>
  );
}
