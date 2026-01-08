import { promises as fs } from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, timestamp, role, userAgent } = req.body

  if (!email || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const loginsPath = path.join(process.cwd(), 'data', 'loginSessions.json')
    const raw = await fs.readFile(loginsPath, 'utf8').catch(() => '[]')
    let sessions = JSON.parse(raw || '[]')

    const sessionRecord = {
      id: Math.random().toString(36).slice(2, 10),
      email,
      timestamp,
      role: role || 'buyer',
      userAgent: userAgent || 'unknown',
      verificationImage: null,
      icStorageStatus: 'not-collected'
    }

    sessions.push(sessionRecord)

    // Keep last 1000 sessions
    if (sessions.length > 1000) {
      sessions = sessions.slice(-1000)
    }

    await fs.writeFile(loginsPath, JSON.stringify(sessions, null, 2))

    return res.status(200).json({ 
      ok: true, 
      sessionId: sessionRecord.id,
      message: 'Login session recorded',
      note: 'IC blockchain storage integration pending'
    })
  } catch (e) {
    console.error('Record login error:', e)
    return res.status(500).json({ error: 'Failed to record login session' })
  }
}
