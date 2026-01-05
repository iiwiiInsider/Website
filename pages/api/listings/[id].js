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

async function writeListings(listings){
  await fs.mkdir(path.dirname(listingsPath), { recursive: true })
  await fs.writeFile(listingsPath, JSON.stringify(listings, null, 2))
}

export default async function handler(req, res){
  if(req.method !== 'DELETE') return res.status(405).end()

  const idRaw = req.query.id
  const id = Number(idRaw)
  if(!Number.isFinite(id)) return res.status(400).json({ ok:false, error:'Invalid id' })

  const listings = await readListings()
  const next = listings.filter(l => Number(l.id) !== id)
  const deleted = next.length !== listings.length
  await writeListings(next)

  return res.json({ ok: true, deleted })
}
