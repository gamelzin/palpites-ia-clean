export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    const apiUrl = process.env.WHATSAPP_API_URL!;
    const apiKey = process.env.WHATSAPP_API_KEY!;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;

    const payload = {
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { body: message }
    };

    const res = await fetch(`${apiUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "D360-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Erro WhatsApp API:", errorBody);
      throw new Error(`HTTP ${res.status}`);
    }

    return true;
  } catch (err) {
    console.error("Erro ao enviar WhatsApp:", err);
    return false;
  }
}
