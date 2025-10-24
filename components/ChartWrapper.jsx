'use client'

import { useState } from 'react'
import ChartDesempenho from './ChartDesempenho'

export default function ChartWrapper({ hits, draws, losses }) {
  const [period, setPeriod] = useState('7')

  return (
    <div>
      <div className="flex justify-end mb-4">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-600"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="all">Todos</option>
        </select>
      </div>

      <ChartDesempenho hits={hits} draws={draws} losses={losses} />
    </div>
  )
}
