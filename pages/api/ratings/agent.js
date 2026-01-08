import { promises as fs } from 'fs'
import path from 'path'

const RATINGS_FILE = path.join(process.cwd(), 'data', 'ratings.json')

async function readRatings() {
  const raw = await fs.readFile(RATINGS_FILE, 'utf8').catch(() => '{}')
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { email } = req.query

    if (!email) return res.status(400).json({ error: 'Agent email required' })

    const ratings = await readRatings()
    const agentRatings = ratings[String(email).toLowerCase()] || {
      email: String(email).toLowerCase(),
      reviews: [],
      averageRating: 0,
      totalReviews: 0
    }

    return res.status(200).json({ ok: true, ...agentRatings })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load ratings' })
  }
}
