import { getServerSession } from 'next-auth/next'
import { promises as fs } from 'fs'
import path from 'path'
import { authOptions } from '../auth/[...nextauth]'

const LISTINGS_FILE = path.join(process.cwd(), 'data', 'marketListings.json')
const PURCHASES_FILE = path.join(process.cwd(), 'data', 'purchases.json')

async function readJson(file, fallback){
  const raw = await fs.readFile(file, 'utf8').catch(()=> fallback)
  try{ return JSON.parse(raw || fallback) }catch{ return JSON.parse(fallback) }
}

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()
  if(!email) return res.status(401).json({ error: 'Unauthorized' })

  const idsParam = Array.isArray(req.query?.ids) ? req.query.ids[0] : req.query?.ids
  const ids = String(idsParam || '').split(',').map(s=>s.trim()).filter(Boolean)
  if(ids.length === 0) return res.status(400).json({ error: 'ids required' })

  const listings = await readJson(LISTINGS_FILE, '[]')
  const purchases = await readJson(PURCHASES_FILE, '[]')

  const owned = listings.filter(l => String(l.ownerEmail || '').trim().toLowerCase() === email)
  const ownedMap = new Map(owned.map(l => [String(l.id), l]))

  const status = {}
  for(const id of ids){
    const listing = ownedMap.get(String(id))
    if(!listing){
      // Only report status for user's own listings
      continue
    }
    const relatedPurchases = purchases.filter(p => String(p.propertyId) === String(id))
    const hasAccepted = relatedPurchases.some(p => p.status === 'accepted' || p.status === 'completed')
    status[String(id)] = hasAccepted ? 'sold' : 'listed'
  }

  return res.status(200).json({ ok: true, status })
}
