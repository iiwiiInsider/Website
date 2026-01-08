import { promises as fs } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { appendAudit } from '../../../lib/audit'

const RATINGS_FILE = path.join(process.cwd(), 'data', 'ratings.json')

async function readRatings() {
  const raw = await fs.readFile(RATINGS_FILE, 'utf8').catch(() => '{}')
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

async function writeRatings(data) {
  await fs.mkdir(path.dirname(RATINGS_FILE), { recursive: true })
  await fs.writeFile(RATINGS_FILE, JSON.stringify(data, null, 2))
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()

  if (!email) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'POST') {
    try {
      const { agentEmail, propertyId, rating, comment, transactionId } = req.body || {}

      if (!agentEmail || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Valid agent email and rating (1-5) required' })
      }

      const ratings = await readRatings()

      if (!ratings[agentEmail]) {
        ratings[agentEmail] = {
          email: agentEmail,
          reviews: [],
          averageRating: 0,
          totalReviews: 0
        }
      }

      const review = {
        id: `rev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        ratedBy: email,
        rating: Number(rating),
        comment: String(comment || '').slice(0, 500),
        propertyId: propertyId || null,
        transactionId: transactionId || null,
        createdAt: new Date().toISOString()
      }

      ratings[agentEmail].reviews.push(review)
      
      // Recalculate average rating
      const reviews = ratings[agentEmail].reviews
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
      ratings[agentEmail].averageRating = Math.round((sum / reviews.length) * 10) / 10
      ratings[agentEmail].totalReviews = reviews.length

      await writeRatings(ratings)

      await appendAudit({
        actorEmail: email,
        action: 'RATING_CREATED',
        targetType: 'rating',
        targetId: review.id,
        data: {
          agentEmail,
          rating,
          propertyId
        }
      })

      return res.status(201).json({ ok: true, review })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to create rating' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
