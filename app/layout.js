// app/layout.js
import React from "react";

export const metadata = {
  title: "palpites.IA — Futebol todos os dias",
  description: "Assinatura de palpites diários no WhatsApp. Sem promessas de ganhos.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}






