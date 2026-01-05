import { promises as fs } from 'fs'
import path from 'path'

const CLAIMS_FILE = path.join(process.cwd(), 'data', 'propertyClaims.json')
const AGENTS_FILE = path.join(process.cwd(), 'data', 'agents.json')

async function readJson(filePath, fallback){
  const raw = await fs.readFile(filePath, 'utf8').catch(()=> null)
  if(!raw) return fallback
  try{ return JSON.parse(raw) }catch{ return fallback }
}

export default async function handler(req, res){
  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const idsParam = String(req.query?.ids || '')
  const requestedIds = idsParam
    .split(',')
    .map(s=>s.trim())
    .filter(Boolean)

  const claims = await readJson(CLAIMS_FILE, {})
  const agents = await readJson(AGENTS_FILE, {})

  const out = {}
  for(const id of requestedIds){
    const claim = claims[id]
    if(!claim) continue
    const email = String(claim.agentEmail || '').toLowerCase()
    out[id] = {
      agentEmail: email || null,
      claimedAt: claim.claimedAt || null,
      profile: email && agents[email] ? agents[email] : null
    }
  }

  return res.status(200).json({ ok: true, claims: out })
}
