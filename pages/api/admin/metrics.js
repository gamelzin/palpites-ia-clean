import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  try {
    const since = new Date(Date.now() - 30*24*60*60*1000).toISOString()
    const { data: picks } = await supabaseAdmin.from('picks').select('*').gte('created_at', since)
    const total = picks?.length || 0
    const wins = picks?.filter(p=>p.result==='win').length || 0
    const losses = picks?.filter(p=>p.result==='lose').length || 0
    const hitRate = total ? Math.round(1000 * wins/total)/10 : 0
    const profitSim = (wins*100) - (losses*100)

    const { data: lastSends } = await supabaseAdmin.from('send_logs').select('*').order('sent_at', { ascending:false }).limit(10)

    res.status(200).json({ total, wins, losses, hitRate, profitSim, lastSends })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
}
