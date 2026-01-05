import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { readAuditLatest } from '../../../lib/audit'

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()
  if(email !== 'admin@local.test') return res.status(403).json({ error: 'Forbidden' })

  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const limit = req.query?.limit
  const entries = await readAuditLatest(limit ? Number(limit) : 100)
  return res.status(200).json({ ok: true, entries })
}
