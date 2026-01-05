import { promises as fs } from 'fs'
import path from 'path'
import seed from '../../../data/properties'

const listingsPath = path.join(process.cwd(), 'data', 'listings.json')

async function readListings(){
  const raw = await fs.readFile(listingsPath, 'utf8').catch(async () => {
    await fs.mkdir(path.dirname(listingsPath), { recursive: true })
    await fs.writeFile(listingsPath, JSON.stringify(seed, null, 2))
    return JSON.stringify(seed)
  })
  return JSON.parse(raw || '[]')
}

export default async function handler(req, res){
  if(req.method !== 'GET') return res.status(405).end()
  const listings = await readListings()
  return res.json({ ok: true, listings })
}
