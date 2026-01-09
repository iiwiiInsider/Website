import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { appendAudit } from '../../../lib/audit'
import { getDefaultUserSettings } from '../../../lib/userSettings'

const TOKENS_PATH = path.join(process.cwd(), 'data', 'verificationTokens.json')
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'userSettings.json')

async function readTokens(){
  const raw = await fs.readFile(TOKENS_PATH, 'utf8').catch(()=> '[]')
  try{
    return JSON.parse(raw || '[]')
  }catch{
    return []
  }
}

async function writeTokens(tokens){
  await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2))
}

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

  const { code } = req.body || {}
  if(!code){
    return res.status(400).json({ error: 'Verification code is required' })
  }

  try{
    let allTokens = await readTokens()
    const now = Date.now()
    
    // Find the token for this email
    const token = allTokens.find(t => String(t.email || '').toLowerCase() === email)
    
    if(!token){
      return res.status(400).json({ error: 'No valid verification code found. Please request a new code.' })
    }
    
    // Check if token is expired
    if((token.expiresAt || 0) <= now){
      const validTokens = allTokens.filter(t => (t.expiresAt || 0) > now)
      await writeTokens(validTokens)
      return res.status(400).json({ error: 'Verification code expired. Please request a new code.' })
    }

    const enteredCode = String(code).trim()
    const storedCode = String(token.code || '')
    if(enteredCode !== storedCode){
      return res.status(400).json({ error: 'Invalid verification code' })
    }
    
    // Remove the used token
    let tokens = allTokens.filter(t => t.email !== email)
    await writeTokens(tokens)

    const settings = await readSettings()
    const userSettings = settings[email] || getDefaultUserSettings()
    userSettings.emailVerified = true
    userSettings.emailVerifiedAt = new Date().toISOString()
    settings[email] = userSettings
    await writeSettings(settings)

    await appendAudit({
      actorEmail: email,
      action: 'USER_EMAIL_VERIFIED',
      targetType: 'user',
      targetId: email
    })

    return res.status(200).json({ ok: true, message: 'Email verified successfully' })
  }catch(e){
    console.error('verify-email-confirm error', e)
    return res.status(500).json({ error: 'Failed to verify code' })
  }
}
