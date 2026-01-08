import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' })
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' })
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

    const user = users[userIndex]

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    // Hash and update new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    users[userIndex].passwordHash = newPasswordHash
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2))

    return res.status(200).json({ ok: true, message: 'Password updated successfully' })
  } catch (e) {
    console.error('Change password error:', e)
    return res.status(500).json({ error: 'Failed to update password' })
  }
}
