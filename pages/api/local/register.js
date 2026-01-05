import { promises as fs } from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '../../../lib/email'

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end()
  const { email, password, name } = req.body || {}
  const normalized = String(email || '').trim().toLowerCase()
  if(!normalized || !password) return res.status(400).json({error:'Email and password required'})

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  if(!isValidEmail) return res.status(400).json({ error: 'Valid email required' })

  const usersPath = path.join(process.cwd(), 'data', 'users.json')
  await fs.mkdir(path.dirname(usersPath), { recursive: true })
  const raw = await fs.readFile(usersPath, 'utf8').catch(()=> '[]')
  const users = JSON.parse(raw || '[]')
  if(users.find(u => u.email === normalized)) return res.status(409).json({error:'User exists'})

  const passwordHash = await bcrypt.hash(password, 10)
  const id = (Date.now()).toString(36)
  const user = { id, email: normalized, name: name || '', passwordHash }
  users.push(user)
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2))

  try{
    await sendWelcomeEmail(normalized, name || normalized, process.env.BUSINESS_NAME || 'Business')
  }catch(e){
    console.error('Welcome email failed', e)
  }

  return res.json({ok:true, user:{id:user.id,email:user.email,name:user.name}})
}
