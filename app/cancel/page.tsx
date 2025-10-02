export default function CancelPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-red-50 px-6">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-lg">
        <h1 className="text-3xl font-bold text-red-700 mb-4">
          ❌ Pagamento não concluído
        </h1>
        <p className="text-gray-700 mb-6">
          Parece que você cancelou a assinatura.  
          Mas não se preocupe, você pode tentar novamente a qualquer momento!
        </p>
        <a
          href="/"
          className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700"
        >
          Voltar para a página inicial
        </a>
      </div>
    </main>
  )
}
