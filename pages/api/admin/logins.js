import { getServerSession } from 'next-auth/next'
import { promises as fs } from 'fs'
import path from 'path'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()
  const isAdmin = email === 'admin@local.test'
  if(!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try{
    const logsPath = path.join(process.cwd(), 'data', 'logins.json')
    const raw = await fs.readFile(logsPath, 'utf8').catch(()=> '{}')
    let logs
    try{
      logs = JSON.parse(raw || '{"anonymous":[],"authenticated":[]}')
    }catch{
      logs = { anonymous: [], authenticated: [] }
    }
    const authenticated = logs.authenticated || []
    const sorted = authenticated.sort((a,b)=> new Date(b.time) - new Date(a.time))
    return res.status(200).json({ ok: true, logins: sorted.slice(0, 200) })
  }catch(e){
    return res.status(500).json({ error: 'Failed to load logs' })
  }
}
