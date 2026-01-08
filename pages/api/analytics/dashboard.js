import { promises as fs } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const TRANSACTIONS_FILE = path.join(process.cwd(), 'data', 'transactions.json')
const ENGAGEMENT_FILE = path.join(process.cwd(), 'data', 'engagement.json')
const RATINGS_FILE = path.join(process.cwd(), 'data', 'ratings.json')

async function readJson(filePath, fallback) {
  const raw = await fs.readFile(filePath, 'utf8').catch(() => null)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()
  
  if (!email) return res.status(401).json({ error: 'Unauthorized' })

  const isAdmin = email === 'admin@local.test'

  if (req.method === 'GET') {
    try {
      const transactions = await readJson(TRANSACTIONS_FILE, [])
      const engagement = await readJson(ENGAGEMENT_FILE, {})
      const ratings = await readJson(RATINGS_FILE, {})

      // Filter data for user or admin
      let userTransactions = isAdmin 
        ? transactions 
        : transactions.filter(t => t.agentEmail === email)

      const userEngagement = engagement[email] || { events: [] }
      const userRatings = ratings[email] || { reviews: [], averageRating: 0 }

      // Calculate metrics
      const totalRevenue = userTransactions.reduce((sum, t) => sum + (t.breakdown?.agentEarnings || 0), 0)
      const totalTransactions = userTransactions.length
      const avgTransactionValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0
      
      const engagementEvents = userEngagement.events || []
      const eventCounts = {
        viewed: engagementEvents.filter(e => e.type === 'property_viewed').length,
        claimed: engagementEvents.filter(e => e.type === 'listing_claimed').length,
        inquiries: engagementEvents.filter(e => e.type === 'inquiry_sent').length,
        messages: engagementEvents.filter(e => e.type === 'message_sent').length
      }

      // Aggregate stats for admin
      let adminStats = null
      if (isAdmin) {
        const allAgentEmails = [...new Set(transactions.map(t => t.agentEmail))]
        const totalPlatformRevenue = transactions.reduce((sum, t) => sum + (t.breakdown?.platformFee || 0), 0)
        
        adminStats = {
          totalTransactions: transactions.length,
          totalRevenue: transactions.reduce((sum, t) => sum + t.listingPrice, 0),
          platformEarnings: totalPlatformRevenue,
          totalAgents: allAgentEmails.length,
          avgTransactionValue: transactions.length > 0 
            ? Math.round(transactions.reduce((sum, t) => sum + t.listingPrice, 0) / transactions.length)
            : 0
        }
      }

      return res.status(200).json({
        ok: true,
        dashboard: {
          userMetrics: {
            totalRevenue,
            totalTransactions,
            avgTransactionValue,
            averageRating: userRatings.averageRating,
            totalReviews: userRatings.reviews?.length || 0,
            engagement: eventCounts,
            lastActivity: userEngagement.lastActivity || null
          },
          adminStats: isAdmin ? adminStats : null
        }
      })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to load dashboard' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
