import { promises as fs } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { ENGAGEMENT_EVENTS } from '../../../lib/engagement'
import { appendAudit } from '../../../lib/audit'

const ENGAGEMENT_FILE = path.join(process.cwd(), 'data', 'engagement.json')

async function readEngagement() {
  const raw = await fs.readFile(ENGAGEMENT_FILE, 'utf8').catch(() => '{}')
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

async function writeEngagement(data) {
  await fs.mkdir(path.dirname(ENGAGEMENT_FILE), { recursive: true })
  await fs.writeFile(ENGAGEMENT_FILE, JSON.stringify(data, null, 2))
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()

  if (!email) return res.status(401).json({ error: 'Unauthorized' })

  // POST: Log engagement event
  if (req.method === 'POST') {
    try {
      const { eventType, propertyId, metadata } = req.body || {}

      if (!eventType || !Object.values(ENGAGEMENT_EVENTS).includes(eventType)) {
        return res.status(400).json({ error: 'Invalid event type' })
      }

      const engagement = await readEngagement()
      
      if (!engagement[email]) {
        engagement[email] = {
          email,
          events: [],
          createdAt: new Date().toISOString()
        }
      }

      const event = {
        id: `evt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        type: eventType,
        propertyId: propertyId || null,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      }

      engagement[email].events.push(event)
      engagement[email].lastActivity = new Date().toISOString()

      await writeEngagement(engagement)

      return res.status(201).json({ ok: true, event })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to log engagement' })
    }
  }

  // GET: Get engagement data for user
  if (req.method === 'GET') {
    try {
      const engagement = await readEngagement()
      const userEngagement = engagement[email] || { email, events: [], createdAt: new Date().toISOString() }

      return res.status(200).json({ ok: true, ...userEngagement })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to load engagement data' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
