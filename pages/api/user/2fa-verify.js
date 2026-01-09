import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'
import speakeasy from 'speakeasy'
import { appendAudit } from '../../../lib/audit'
import { getDefaultUserSettings } from '../../../lib/userSettings'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'userSettings.json')

async function readSettings(){
  const raw = await fs.readFile(SETTINGS_FILE, 'utf8').catch(()=> '{}')
  try{
    return JSON.parse(raw || '{}')
  }catch{
    return {}
  }
}

async function writeSettings(settings){
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

export default async function handler(req, res){
  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').toLowerCase()
  if(!email){
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { secret, code } = req.body || {}
  if(!secret || !code){
    return res.status(400).json({ error: 'Secret and code are required' })
  }

  try{
    // Verify the code matches the secret
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: String(code).trim(),
      window: 1
    })

    if(!verified){
      return res.status(400).json({ error: 'Invalid authentication code' })
    }

    // Store the secret and enable 2FA
    const settings = await readSettings()
    const userSettings = settings[email] || getDefaultUserSettings()
    userSettings.twoFAEnabled = true
    userSettings.twoFASecret = secret
    userSettings.twoFAEnabledAt = new Date().toISOString()
    userSettings.accountVerified = true
    userSettings.accountVerifiedAt = new Date().toISOString()
    settings[email] = userSettings
    await writeSettings(settings)

    await appendAudit({
      actorEmail: email,
      action: 'USER_2FA_ENABLED',
      targetType: 'user',
      targetId: email
    })

    console.log('2FA enabled for:', email)
    return res.status(200).json({ ok: true, message: 'Two-factor authentication enabled' })
  }catch(e){
    console.error('2fa-verify error', e)
    return res.status(500).json({ error: 'Failed to enable 2FA' })
  }
}
