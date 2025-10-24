'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'

export default function ChartDesempenho({ hits, draws, losses }) {
  const chartData = [
    { name: 'Acertos', value: hits, color: '#22c55e' }, // verde
    { name: 'Empates', value: draws, color: '#9ca3af' }, // cinza
    { name: 'Erros', value: losses, color: '#ef4444' }, // vermelho
  ]

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 shadow">
      <h2 className="text-lg font-medium mb-4 text-neutral-200">
        Desempenho dos Últimos 50 Picks
      </h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#888" />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="value" name="Quantidade">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
