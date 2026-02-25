import { promises as fs } from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendLoginVerificationCode } from '../../../lib/email'

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')
const TOKENS_PATH = path.join(process.cwd(), 'data', 'loginTokens.json')

function generateCode(){
  return String(crypto.randomInt(100000, 999999))
}

export default async function handler(req, res){
  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body || {}
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if(!normalizedEmail || !password){
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try{
    // Validate credentials
    const raw = await fs.readFile(USERS_PATH, 'utf8').catch(()=> '[]')
    const users = JSON.parse(raw || '[]')
    const user = users.find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail)

    if(!user){
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash)
    if(!valid){
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate 6-digit code
    const code = generateCode()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store code (plain — compared directly as with verificationTokens)
    const tokensRaw = await fs.readFile(TOKENS_PATH, 'utf8').catch(()=> '[]')
    let tokens = []
    try{ tokens = JSON.parse(tokensRaw || '[]') }catch{ tokens = [] }
    const now = Date.now()
    // Remove expired tokens and any existing token for this email
    tokens = tokens.filter(t => (t.expiresAt || 0) > now && t.email !== normalizedEmail)
    tokens.push({ email: normalizedEmail, code, expiresAt })
    await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2))

    await sendLoginVerificationCode({ toEmail: normalizedEmail, code })
    return res.status(200).json({ ok: true })
  }catch(e){
    console.error('send-login-code error', e)
    return res.status(500).json({ error: 'Failed to send verification code' })
  }
}
