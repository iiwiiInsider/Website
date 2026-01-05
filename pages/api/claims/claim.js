import { getServerSession } from 'next-auth/next'
import { promises as fs } from 'fs'
import path from 'path'
import { authOptions } from '../auth/[...nextauth]'
import { appendAudit } from '../../../lib/audit'

const CLAIMS_FILE = path.join(process.cwd(), 'data', 'propertyClaims.json')
const AGENTS_FILE = path.join(process.cwd(), 'data', 'agents.json')

async function readJson(filePath, fallback){
  const raw = await fs.readFile(filePath, 'utf8').catch(()=> null)
  if(!raw) return fallback
  try{ return JSON.parse(raw) }catch{ return fallback }
}

async function writeJson(filePath, value){
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(value, null, 2))
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  const email = (session?.user?.email || '').toLowerCase().trim()
  if(!email) return res.status(401).json({ error: 'Unauthorized' })

  const { propertyId } = req.body || {}
  const id = String(propertyId || '').trim()
  if(!id) return res.status(400).json({ error: 'propertyId required' })

  const agents = await readJson(AGENTS_FILE, {})
  const profile = agents[email] || null

  const missingFields = []
  if(!profile?.displayName) missingFields.push('displayName')
  if(!profile?.phone) missingFields.push('phone')
  if(!profile?.agency) missingFields.push('agency')

  if(missingFields.length > 0){
    return res.status(400).json({
      error: 'Agent profile incomplete',
      missingFields
    })
  }

  const claims = await readJson(CLAIMS_FILE, {})
  if(claims[id]){
    return res.status(409).json({ error: 'Already claimed' })
  }

  claims[id] = {
    agentEmail: email,
    claimedAt: new Date().toISOString()
  }
  await writeJson(CLAIMS_FILE, claims)

  await appendAudit({
    actorEmail: email,
    action: 'CLAIM_CREATED',
    targetType: 'property',
    targetId: id,
    data: { agentEmail: email }
  })

  return res.status(200).json({ ok: true })
}
