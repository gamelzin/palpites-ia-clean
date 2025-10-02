"use client";

export default function PricingPage() {
  const handleCheckout = async (priceId) => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url; // Redireciona para Stripe Checkout
    } else {
      alert("Erro ao iniciar checkout. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-16">
      <h1 className="text-4xl font-bold mb-10">Escolha seu plano</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
        {/* Mensal */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Mensal</h3>
          <p className="text-4xl font-extrabold text-green-600 mb-6">R$49,90</p>
          <button
            onClick={() => handleCheckout("price_id_mensal")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Assinar
          </button>
        </div>

        {/* Trimestral */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-4 border-green-600">
          <h3 className="text-2xl font-bold mb-4">Trimestral</h3>
          <p className="text-4xl font-extrabold text-green-600 mb-2">R$129,90</p>
          <p className="text-sm text-green-600 mb-6">Economize 10%</p>
          <button
            onClick={() => handleCheckout("price_id_trimestral")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Assinar
          </button>
        </div>

        {/* Anual */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Anual</h3>
          <p className="text-4xl font-extrabold text-green-600 mb-2">R$419,90</p>
          <p className="text-sm text-green-600 mb-6">Economize 30%</p>
          <button
            onClick={() => handleCheckout("price_id_anual")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Assinar
          </button>
        </div>
      </div>
    </div>
  );
}
