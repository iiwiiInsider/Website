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
  const propertyId = String(req.query?.propertyId || '').trim()
  if(!propertyId) return res.status(400).json({ error: 'propertyId required' })

  const claims = await readJson(CLAIMS_FILE, {})
  const claim = claims[propertyId]
  if(!claim) return res.status(200).json({ ok: true, claimed: false, claim: null })

  const agents = await readJson(AGENTS_FILE, {})
  const email = String(claim.agentEmail || '').toLowerCase()

  return res.status(200).json({
    ok: true,
    claimed: true,
    claim: {
      agentEmail: email || null,
      claimedAt: claim.claimedAt || null,
      profile: email && agents[email] ? agents[email] : null
    }
  })
}
