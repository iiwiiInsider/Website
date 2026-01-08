import { getServerSession } from 'next-auth/next'
import { promises as fs } from 'fs'
import path from 'path'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()
  const isAdmin = email === 'admin@local.test'
  if(!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try{
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const raw = await fs.readFile(usersPath, 'utf8').catch(()=> '[]')
    const users = JSON.parse(raw || '[]')
    const sanitized = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name || '',
      role: u.role || 'buyer',
      createdAt: u.createdAt || null
    }))
    return res.status(200).json({ ok: true, users: sanitized })
  }catch(e){
    return res.status(500).json({ error: 'Failed to load users' })
  }
}
