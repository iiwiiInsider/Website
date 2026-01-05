import { promises as fs } from 'fs'
import path from 'path'

export default async function handler(req, res){
  if(req.method !== 'GET') return res.status(405).json({error:'Method not allowed'})
  try{
    const email = String(req.query.email || '').toLowerCase()
    const file = path.join(process.cwd(), 'data', 'logins.json')
    const raw = await fs.readFile(file, 'utf8').catch(()=> '{}')
    let logs
    try{
      logs = JSON.parse(raw || '{"anonymous":[],"authenticated":[]}')
    }catch{
      logs = { anonymous: [], authenticated: [] }
    }
    const authenticated = logs.authenticated || []
    const filtered = email ? authenticated.filter(r => (r.email || '').toLowerCase() === email) : authenticated
    const sorted = filtered.sort((a,b)=> new Date(b.time) - new Date(a.time))
    res.status(200).json(sorted.slice(0, 10))
  }catch(e){
    console.error('tracking/recent error', e)
    res.status(500).json({error:'Failed to fetch recent logs'})
  }
}
