import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  
  if(!session?.user?.email){
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if(req.method !== 'GET'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try{
    const cartPath = path.join(process.cwd(), 'data', 'cart.json')
    let cartData = []
    
    try{
      const raw = await fs.readFile(cartPath, 'utf8')
      cartData = JSON.parse(raw)
    }catch(e){
      cartData = []
    }

    const userCart = cartData.find(c => c.email === session.user.email)
    
    return res.status(200).json({ 
      items: userCart?.items || [],
      count: userCart?.items?.length || 0
    })
  }catch(e){
    console.error('Get cart failed:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
