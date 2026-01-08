import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  
  // Verify admin access
  if(!session?.user?.email || session.user.email !== 'admin@local.test'){
    return res.status(403).json({ error: 'Admin access only' })
  }

  if(req.method === 'GET'){
    // Get all users with their roles
    try{
      const usersPath = path.join(process.cwd(), 'data', 'users.json')
      const raw = await fs.readFile(usersPath, 'utf8')
      const users = JSON.parse(raw || '[]')
      
      return res.status(200).json({ users })
    }catch(e){
      return res.status(500).json({ error: 'Failed to load users' })
    }
  }

  if(req.method === 'PUT'){
    // Update user role
    try{
      const { userId, role } = req.body
      
      if(!userId || !role){
        return res.status(400).json({ error: 'Missing userId or role' })
      }

      const usersPath = path.join(process.cwd(), 'data', 'users.json')
      const raw = await fs.readFile(usersPath, 'utf8')
      const users = JSON.parse(raw || '[]')
      
      const userIndex = users.findIndex(u => u.id === userId)
      
      if(userIndex === -1){
        return res.status(404).json({ error: 'User not found' })
      }

      users[userIndex].role = role
      users[userIndex].updatedAt = new Date().toISOString()
      
      await fs.writeFile(usersPath, JSON.stringify(users, null, 2))
      
      return res.status(200).json({ success: true, user: users[userIndex] })
    }catch(e){
      return res.status(500).json({ error: 'Failed to update user' })
    }
  }

  if(req.method === 'DELETE'){
    // Delete user
    try{
      const { userId } = req.body
      
      if(!userId){
        return res.status(400).json({ error: 'Missing userId' })
      }

      // Prevent deleting admin
      if(userId === 'admin-local'){
        return res.status(403).json({ error: 'Cannot delete admin account' })
      }

      const usersPath = path.join(process.cwd(), 'data', 'users.json')
      const raw = await fs.readFile(usersPath, 'utf8')
      const users = JSON.parse(raw || '[]')
      
      const updatedUsers = users.filter(u => u.id !== userId)
      
      await fs.writeFile(usersPath, JSON.stringify(updatedUsers, null, 2))
      
      return res.status(200).json({ success: true })
    }catch(e){
      return res.status(500).json({ error: 'Failed to delete user' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
