import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PALPITES.IA — Palpites Esportivos com Inteligência Artificial e Análise Estatística",
  description:
    "Receba palpites de Futebol e Basquete gerados por uma IA exclusiva da PALPITES.IA — baseada em estatísticas oficiais, desempenho recente e probabilidades seguras. Resultados com inteligência, estratégia e confiança.",
  openGraph: {
    title: "PALPITES.IA — Inteligência, Estratégia e Performance em Palpites",
    description:
      "Análises automatizadas com base em estatísticas e IA avançada. Receba palpites seguros de Futebol e Basquete diretamente no seu WhatsApp.",
    url: "https://palpitesia.com.br",
    siteName: "PALPITES.IA",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PALPITES.IA — Palpites Esportivos Inteligentes",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}










