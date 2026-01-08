import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

const TOKENS_PATH = path.join(process.cwd(), 'data', 'deleteTokens.json')
const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')
const JUNK_PATH = path.join(process.cwd(), 'data', 'junkIC.json')

export default async function handler(req, res){
  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if(!session?.user?.email){
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { code } = req.body || {}
  if(!code){
    return res.status(400).json({ error: 'Code is required' })
  }

  const email = String(session.user.email).toLowerCase()

  try{
    const rawTokens = await fs.readFile(TOKENS_PATH, 'utf8').catch(()=> '[]')
    let tokens = JSON.parse(rawTokens || '[]')
    const now = Date.now()
    tokens = tokens.filter(t => t && t.email && (t.expiresAt || 0) > now)
    const token = tokens.find(t => t.email === email)
    if(!token){
      return res.status(400).json({ error: 'No valid code found. Request a new one.' })
    }

    const valid = await bcrypt.compare(String(code), token.codeHash || '')
    if(!valid){
      return res.status(400).json({ error: 'Invalid code' })
    }

    const rawUsers = await fs.readFile(USERS_PATH, 'utf8').catch(()=> '[]')
    let users = JSON.parse(rawUsers || '[]')
    const userToDelete = users.find(u => String(u.email || '').toLowerCase() === email)
    
    // Archive to junk IC canister before deletion
    if(userToDelete){
      const rawJunk = await fs.readFile(JUNK_PATH, 'utf8').catch(()=> '[]')
      let junk = JSON.parse(rawJunk || '[]')
      junk.push({
        ...userToDelete,
        deletedAt: new Date().toISOString()
      })
      await fs.writeFile(JUNK_PATH, JSON.stringify(junk, null, 2))
    }
    
    const nextUsers = users.filter(u => String(u.email || '').toLowerCase() !== email)
    await fs.writeFile(USERS_PATH, JSON.stringify(nextUsers, null, 2))

    tokens = tokens.filter(t => t.email !== email)
    await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2))

    return res.status(200).json({ ok: true, message: 'Account deleted successfully' })
  }catch(e){
    console.error('delete-confirm error', e)
    return res.status(500).json({ error: 'Failed to delete account' })
  }
}
