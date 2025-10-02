// Função utilitária para montar mensagens padronizadas

// Rodapé fixo de conscientização
const RODAPE = `
─────────────────────────────
📌 *Importante*:
⚠️ Use sempre gestão de banca para segurança nos investimentos.
💡 Palpites.IA é uma ferramenta de apoio, não garantia de resultados.
─────────────────────────────
`

/**
 * Monta uma mensagem completa com a parte principal + rodapé padronizado.
 * @param conteudo string - Texto principal (palpites, relatórios, etc.)
 */
export function montarMensagem(conteudo: string): string {
  return conteudo + "\n" + RODAPE
}
