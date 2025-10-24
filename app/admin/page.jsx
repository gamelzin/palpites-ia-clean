import { supabaseAdmin } from '@/lib/supabaseAdmin'
import ChartWrapper from '@/components/ChartWrapper'
import Link from 'next/link'

async function getDashboardData() {
  const subs = await supabaseAdmin
    .from('subscribers')
    .select('id, plano, status, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  if (subs.error) throw subs.error

  const users = await supabaseAdmin
    .from('users')
    .select('id, nome, email_usuario, numero_usuario, plano_usuario, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  if (users.error) throw users.error

  const picks = await supabaseAdmin
    .from('picks')
    .select(
      'id, fora_time, league_times, dados_times, created_at_times, data_utc_times, esportes, match_id'
    )
    .order('data_utc_times', { ascending: false })
    .limit(500)
  if (picks.error) throw picks.error

  const logs = await supabaseAdmin
    .from('send_logs')
    .select('id, subscriber_id, pick_id, message, status, sent_at')
    .order('sent_at', { ascending: false })
    .limit(500)
  if (logs.error) throw logs.error

  return {
    subscribers: subs.data,
    users: users.data,
    picks: picks.data,
    logs: logs.data,
  }
}

function computeMetrics(picks) {
  const recentPicks = picks.slice(0, 50)
  const total = recentPicks.length

  const hits = recentPicks.filter(
    (p) =>
      p.dados_times &&
      (p.dados_times.toLowerCase().includes('win') ||
        p.dados_times.toLowerCase().includes('acertou'))
  ).length

  const losses = recentPicks.filter(
    (p) =>
      p.dados_times &&
      (p.dados_times.toLowerCase().includes('loss') ||
        p.dados_times.toLowerCase().includes('errou'))
  ).length

  const draws = recentPicks.filter(
    (p) =>
      p.dados_times &&
      (p.dados_times.toLowerCase().includes('draw') ||
        p.dados_times.toLowerCase().includes('empate'))
  ).length

  const winRate = total ? Math.round((hits / total) * 100) : 0

  return { total, hits, losses, draws, winRate }
}

export default async function AdminPage() {
  const { subscribers, users, picks, logs } = await getDashboardData()
  const m = computeMetrics(picks)

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-900 sticky top-0 bg-neutral-950/70 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">palpites.IA • Painel Admin</h1>
          <form action="/api/admin/logout" method="post">
            <button className="px-3 py-1.5 rounded-xl border border-neutral-700 hover:bg-neutral-900">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Cards principais */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Assinantes" value={subscribers.length} subtitle="total" />
          <Card title="Usuários" value={users.length} subtitle="cadastrados" />
          <Card title="Picks" value={m.total} subtitle="últimos 50" />
          <Card title="Taxa de acerto" value={`${m.winRate}%`} subtitle="janela recente" />
        </section>

        {/* Gráfico com filtro (client component) */}
        <ChartWrapper hits={m.hits} draws={m.draws} losses={m.losses} />

        {/* Tabelas */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Table
            title="Picks recentes"
            columns={[
              { key: 'data_utc_times', label: 'Data' },
              { key: 'league_times', label: 'Liga' },
              { key: 'fora_time', label: 'Time Fora' },
              { key: 'dados_times', label: 'Resultado / Dados' },
              { key: 'esportes', label: 'Esporte' },
            ]}
            rows={picks.slice(0, 20).map((p) => ({
              data_utc_times: p.data_utc_times
                ? new Date(p.data_utc_times).toLocaleString()
                : '-',
              league_times: p.league_times || '-',
              fora_time: p.fora_time || '-',
              dados_times: p.dados_times || '-',
              esportes: p.esportes || '-',
            }))}
          />

          <Table
            title="Logs de envio"
            columns={[
              { key: 'sent_at', label: 'Data/Hora' },
              { key: 'subscriber_id', label: 'Assinante' },
              { key: 'pick_id', label: 'Pick' },
              { key: 'message', label: 'Mensagem' },
              { key: 'status', label: 'Status' },
            ]}
            rows={logs.slice(0, 20).map((l) => ({
              sent_at: l.sent_at ? new Date(l.sent_at).toLocaleString() : '-',
              subscriber_id: l.subscriber_id || '-',
              pick_id: l.pick_id || '-',
              message: l.message || '-',
              status: l.status || '-',
            }))}
          />
        </section>
      </main>
    </div>
  )
}

function Card({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 shadow">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-neutral-500 mt-1">{subtitle}</div>}
    </div>
  )
}

function Table({ title, columns, rows }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800 text-sm text-neutral-300">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-2 font-medium text-neutral-400 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-neutral-800">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 text-neutral-200 whitespace-nowrap">
                    {String(row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
