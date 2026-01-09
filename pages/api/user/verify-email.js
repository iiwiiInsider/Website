import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { sendAccountVerificationCode } from '../../../lib/email'

const TOKENS_PATH = path.join(process.cwd(), 'data', 'verificationTokens.json')

function generateCode(){
  return String(crypto.randomInt(100000, 999999))
}

export default async function handler(req, res){
  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if(!session?.user?.email){
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const email = String(session.user.email).toLowerCase()
  const code = generateCode()
  const expiresAt = Date.now() + 15 * 60 * 1000

  try{
    const raw = await fs.readFile(TOKENS_PATH, 'utf8').catch(()=> '[]')
    let tokens = JSON.parse(raw || '[]')
    const now = Date.now()
    tokens = tokens.filter(t => (t.expiresAt || 0) > now && t.email)
    tokens.push({ email, code, expiresAt })
    await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2))

    await sendAccountVerificationCode({ toEmail: email, code })
    return res.status(200).json({ ok: true, message: 'Verification code sent to your email' })
  }catch(e){
    console.error('verify-email error', e)
    return res.status(500).json({ error: 'Failed to send verification code' })
  }
}
