import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔐 Conexão segura com Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { nome, email, telefone } = await req.json();

    console.log("📩 Lead recebido:", { nome, email, telefone });

    const nomeFinal = nome?.trim() || "Não informado";
    const emailFinal = email?.trim() || "nao_informado@palpitesia.com.br";
    const telefoneFinal = telefone?.trim() || "desconhecido";

    // ✅ Agora insere diretamente na tabela leads
    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          nome_cliente: nomeFinal,
          email_cliente: emailFinal,
          telefone: telefoneFinal,
          estado: "novo",
        },
      ])
      .select();

    if (error) {
      console.error("❌ Erro ao salvar lead:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Lead salvo com sucesso:", data);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Erro geral em /api/leads:", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
