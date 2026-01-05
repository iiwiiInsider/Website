import { getServerSession } from 'next-auth/next'
import { promises as fs } from 'fs'
import path from 'path'
import { authOptions } from '../auth/[...nextauth]'
import { appendAudit } from '../../../lib/audit'

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  if(!session?.user?.email){
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const email = String(session.user.email).toLowerCase()
  const filePath = path.join(process.cwd(), 'data', 'agents.json')

  const readAll = async () => {
    const raw = await fs.readFile(filePath, 'utf8').catch(()=> '{}')
    const parsed = JSON.parse(raw || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  }

  if(req.method === 'GET'){
    try{
      const all = await readAll()
      return res.status(200).json({ ok: true, profile: all[email] || null })
    }catch(e){
      return res.status(500).json({ error: 'Failed to load profile' })
    }
  }

  if(req.method === 'POST'){
    try{
      const { displayName, agentEmail, phone, agency, bio } = req.body || {}
      const normalizedAgentEmail = (agentEmail || '').toString().trim().toLowerCase()
      if(normalizedAgentEmail && !normalizedAgentEmail.includes('@')){
        return res.status(400).json({ error: 'Agent email must be a valid email address' })
      }
      const profile = {
        displayName: (displayName || '').toString().trim(),
        agentEmail: normalizedAgentEmail,
        phone: (phone || '').toString().trim(),
        agency: (agency || '').toString().trim(),
        bio: (bio || '').toString().trim(),
        updatedAt: new Date().toISOString()
      }

      await fs.mkdir(path.dirname(filePath), { recursive: true })
      const all = await readAll()
      all[email] = profile
      await fs.writeFile(filePath, JSON.stringify(all, null, 2))

      await appendAudit({
        actorEmail: email,
        action: 'AGENT_PROFILE_SAVE',
        targetType: 'agent',
        targetId: email,
        data: {
          displayName: profile.displayName || null,
          agency: profile.agency || null,
          agentEmail: profile.agentEmail || null
        }
      })

      return res.status(200).json({ ok: true, profile })
    }catch(e){
      return res.status(500).json({ error: 'Failed to save profile' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
