import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'
import bcryptjs from 'bcryptjs'

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  
  // Verify admin access
  if(!session?.user?.email || session.user.email !== 'admin@local.test'){
    return res.status(403).json({ error: 'Admin access only' })
  }

  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try{
    const { name, email, password, role } = req.body

    if(!name || !email || !password){
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    // Validate email format
    if(!email.includes('@')){
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10)

    // Load existing users
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    let users = []
    
    try{
      const raw = await fs.readFile(usersPath, 'utf8')
      users = JSON.parse(raw || '[]')
    }catch(e){
      users = []
    }

    // Check if email already exists
    if(users.some(u => u.email === email)){
      return res.status(400).json({ error: 'Email already in use' })
    }

    // Create new user
    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      email,
      name,
      passwordHash,
      role: role || 'buyer',
      createdAt: new Date().toISOString()
    }

    // Add new user
    users.push(newUser)

    // Save updated users
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2))

    return res.status(201).json({ 
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt
      },
      message: 'User created successfully'
    })

  }catch(e){
    console.error('Error creating user:', e)
    return res.status(500).json({ error: 'Failed to create user: ' + (e.message || 'Unknown error') })
  }
}
