import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { newEmail } = req.body
  const normalizedNewEmail = String(newEmail || '').trim().toLowerCase()

  if (!normalizedNewEmail) {
    return res.status(400).json({ error: 'New email is required' })
  }

  try {
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const raw = await fs.readFile(usersPath, 'utf8').catch(() => '[]')
    let users = JSON.parse(raw || '[]')

    const currentEmail = session.user.email.toLowerCase()
    const userIndex = users.findIndex(u => u.email?.toLowerCase() === currentEmail)

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if new email already exists
    const emailExists = users.some(u => u.email?.toLowerCase() === normalizedNewEmail)
    if (emailExists) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    // Update email
    users[userIndex].email = normalizedNewEmail
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2))

    return res.status(200).json({ ok: true, message: 'Email updated successfully' })
  } catch (e) {
    console.error('Change email error:', e)
    return res.status(500).json({ error: 'Failed to update email' })
  }
}
