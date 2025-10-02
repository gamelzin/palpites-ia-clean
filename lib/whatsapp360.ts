export async function sendWhatsApp(to: string, message: string) {
  // Se não estiver explicitamente habilitado, não envia nada (evita side effects em build)
  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.log("ℹ️ WhatsApp desabilitado (WHATSAPP_ENABLED != 'true'). Mensagem ignorada.");
    return { success: false, skipped: true };
  }

  try {
    const response = await fetch(process.env.WHATSAPP_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": process.env.WHATSAPP_API_KEY!,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erro no envio:", data);
      return { success: false, error: data };
    }

    console.log("✅ Mensagem enviada com sucesso:", data);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Erro geral:", error);
    return { success: false, error };
  }
}
