import "./globals.css";

export const metadata = {
  title: "Palpites.IA",
  description: "Micro-SaaS de palpites de futebol no WhatsApp",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}







