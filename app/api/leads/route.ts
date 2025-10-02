import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { nome, email, telefone } = await req.json();

    const { error } = await supabaseAdmin.from("leads").insert([
      {
        nome,
        email,
        telefone,
        status: "pendente",
      },
    ]);

    if (error) {
      console.error("Erro ao salvar lead:", error.message);
      return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro no endpoint /leads:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
