export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/env'; // usa o centralizador de variáveis

// 🔐 Conexão segura com Supabase
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, email, telefone, plano } = body;

    console.log('📩 Lead recebido:', { nome, email, telefone, plano });

    const nomeFinal = nome?.trim() || 'Não informado';
    const emailFinal = email?.trim().toLowerCase() || 'nao_informado@palpitesia.com.br';
    const telefoneFinal = telefone?.trim() || 'desconhecido';
    const planoFinal = plano?.trim().toLowerCase() || 'futebol';

    // ✅ Insere com todas as colunas existentes + plano
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          nome_cliente: nomeFinal,
          email_cliente: emailFinal,
          telefone: telefoneFinal,
          plano: planoFinal,
          estado: 'novo',
          status: 'ativo',
        },
      ])
      .select();

    if (error) {
      console.error('❌ Erro ao salvar lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Lead salvo com sucesso:', data);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error('❌ Erro geral em /api/leads:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
