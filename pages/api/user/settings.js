import { promises as fs } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getDefaultUserSettings, USER_TOOLS, isValidTool } from '../../../lib/userSettings'
import { appendAudit } from '../../../lib/audit'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'userSettings.json')

async function readSettings() {
  const raw = await fs.readFile(SETTINGS_FILE, 'utf8').catch(() => '{}')
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

async function writeSettings(data) {
  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true })
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2))
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()

  if (!email) return res.status(401).json({ error: 'Unauthorized' })

  // GET: Retrieve user settings
  if (req.method === 'GET') {
    try {
      const settings = await readSettings()
      const userSettings = settings[email] || getDefaultUserSettings()

      return res.status(200).json({ ok: true, settings: userSettings })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to load settings' })
    }
  }

  // POST: Create or update settings
  if (req.method === 'POST') {
    try {
      const { primaryTool, tools, notifications, preferences, buyingSettings, privacy, paymentMethods } = req.body || {}

      // Validate tool selection
      if (primaryTool && !isValidTool(primaryTool)) {
        return res.status(400).json({ error: 'Invalid primary tool selection' })
      }

      if (tools && Array.isArray(tools)) {
        if (!tools.every(t => isValidTool(t))) {
          return res.status(400).json({ error: 'Invalid tool in tools array' })
        }
        if (!tools.includes(primaryTool)) {
          return res.status(400).json({ error: 'Primary tool must be in tools array' })
        }
      }

      const settings = await readSettings()
      const userSettings = settings[email] || getDefaultUserSettings()

      // Update settings
      if (primaryTool) userSettings.primaryTool = primaryTool
      if (tools) userSettings.tools = tools
      if (notifications) userSettings.notifications = { ...userSettings.notifications, ...notifications }
      if (preferences) userSettings.preferences = { ...userSettings.preferences, ...preferences }
      if (buyingSettings) userSettings.buyingSettings = { ...userSettings.buyingSettings, ...buyingSettings }
      if (privacy) userSettings.privacy = { ...userSettings.privacy, ...privacy }
      if (Array.isArray(paymentMethods)) userSettings.paymentMethods = paymentMethods

      userSettings.updatedAt = new Date().toISOString()

      settings[email] = userSettings
      await writeSettings(settings)

      await appendAudit({
        actorEmail: email,
        action: 'USER_SETTINGS_UPDATE',
        targetType: 'user_settings',
        targetId: email,
        data: {
          primaryTool,
          tools: tools?.length || null
        }
      })

      return res.status(200).json({ ok: true, settings: userSettings })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to update settings' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
