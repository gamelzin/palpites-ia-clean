export default function SuccessPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-50 px-6">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-lg">
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          🎉 Assinatura confirmada!
        </h1>
        <p className="text-gray-700 mb-6">
          Obrigado por assinar o <strong>palpites.IA</strong>!  
          Em breve você começará a receber seus palpites diretamente no WhatsApp 📲.
        </p>
        <a
          href="/"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
        >
          Voltar para a página inicial
        </a>
      </div>
    </main>
  )
}
