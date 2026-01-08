import { promises as fs } from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { sendAccountCreatedEmail, sendAdminAccountCreatedEmail } from '../../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { email, password, name, role } = req.body || {}
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const displayName = String(name || '').trim()
  const pwd = String(password || '')
  const normalizedRole = String(role || 'buyer').trim().toLowerCase()

  if (!normalizedEmail || !pwd) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  if (pwd.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  try {
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const raw = await fs.readFile(usersPath, 'utf8').catch(() => '[]')
    let users
    try { users = JSON.parse(raw || '[]') } catch { users = [] }

    const exists = users.some(u => String(u.email || '').trim().toLowerCase() === normalizedEmail)
    if (exists) {
      res.status(409).json({ error: 'User already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(pwd, 10)
    const id = Math.random().toString(36).slice(2, 10)
    const user = { id, email: normalizedEmail, name: displayName, passwordHash, role: normalizedRole, createdAt: new Date().toISOString() }
    users.push(user)
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2))

    const publicUser = { id, email: normalizedEmail, name: displayName, role: normalizedRole, createdAt: user.createdAt }

    // Fire-and-forget notifications; do not block response on failures
    sendAccountCreatedEmail(normalizedEmail, displayName).catch(err => console.error('Failed to send user welcome email', err))
    sendAdminAccountCreatedEmail({ user: publicUser }).catch(err => console.error('Failed to send admin account create email', err))

    res.status(201).json({ ok: true, user: publicUser })
  } catch (e) {
    res.status(500).json({ error: 'Failed to register user' })
  }
}
