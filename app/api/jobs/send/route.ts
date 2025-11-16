import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/whatsapp360";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar último registro do daily_picks
    const { data, error } = await supabase
      .from("daily_picks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({
        ok: false,
        error: "Nenhum daily_picks encontrado."
      });
    }

    const mensagem = data.texto;

    // Buscar assinantes ativos
    const { data: subs } = await supabase
      .from("subscribers")
      .select("*")
      .eq("status", "active");

    if (!subs?.length) {
      return NextResponse.json({
        ok: false,
        error: "Nenhum assinante ativo encontrado."
      });
    }

    // Enviar WhatsApp
    for (const sub of subs) {
      if (!sub.phone) continue;
      await sendWhatsAppMessage(sub.phone, mensagem);
    }

    return NextResponse.json({ ok: true, enviados: subs.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
