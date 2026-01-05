import { getServerSession } from 'next-auth/next'
import { promises as fs } from 'fs'
import path from 'path'
import { authOptions } from '../auth/[...nextauth]'

const AGENTS_FILE = path.join(process.cwd(), 'data', 'agents.json')

async function readAgents(){
  const raw = await fs.readFile(AGENTS_FILE, 'utf8').catch(()=> '{}')
  const parsed = JSON.parse(raw || '{}')
  return parsed && typeof parsed === 'object' ? parsed : {}
}

async function writeAgents(all){
  await fs.mkdir(path.dirname(AGENTS_FILE), { recursive: true })
  await fs.writeFile(AGENTS_FILE, JSON.stringify(all, null, 2))
}

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  const email = (session?.user?.email || '').toLowerCase()
  if(email !== 'admin@local.test'){
    return res.status(403).json({ error: 'Forbidden' })
  }

  if(req.method === 'GET'){
    try{
      const all = await readAgents()
      const agents = Object.entries(all)
        .filter(([agentEmail]) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(agentEmail || '').toLowerCase().trim()))
        .map(([agentEmail, profile]) => ({ email: agentEmail, profile }))
      agents.sort((a,b)=>a.email.localeCompare(b.email))
      return res.status(200).json({ ok: true, agents })
    }catch(e){
      return res.status(500).json({ error: 'Failed to load agents' })
    }
  }

  if(req.method === 'POST'){
    try{
      const { email: agentEmailRaw, profile } = req.body || {}
      const agentEmail = String(agentEmailRaw || '').toLowerCase().trim()
      if(!agentEmail) return res.status(400).json({ error: 'Email required' })

      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agentEmail)
      if(!isValidEmail) return res.status(400).json({ error: 'Valid email required' })

      const nextProfile = {
        displayName: (profile?.displayName || '').toString().trim(),
        phone: (profile?.phone || '').toString().trim(),
        agency: (profile?.agency || '').toString().trim(),
        bio: (profile?.bio || '').toString().trim(),
        updatedAt: new Date().toISOString()
      }

      const all = await readAgents()
      if(!all[agentEmail]) return res.status(404).json({ error: 'Agent not found (admin can only edit or delete existing agents)' })
      all[agentEmail] = nextProfile
      await writeAgents(all)
      return res.status(200).json({ ok: true })
    }catch(e){
      return res.status(500).json({ error: 'Failed to save agent' })
    }
  }

  if(req.method === 'DELETE'){
    try{
      const agentEmail = String(req.query?.email || '').toLowerCase().trim()
      if(!agentEmail) return res.status(400).json({ error: 'Email required' })
      const all = await readAgents()
      if(all[agentEmail]){
        delete all[agentEmail]
        await writeAgents(all)
      }
      return res.status(200).json({ ok: true })
    }catch(e){
      return res.status(500).json({ error: 'Failed to remove agent' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
