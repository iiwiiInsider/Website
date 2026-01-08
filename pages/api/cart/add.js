import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  
  if(!session?.user?.email){
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try{
    const { listingId } = req.body

    if(!listingId){
      return res.status(400).json({ error: 'Missing listingId' })
    }

    const cartPath = path.join(process.cwd(), 'data', 'cart.json')
    let cartData = []
    
    try{
      const raw = await fs.readFile(cartPath, 'utf8')
      cartData = JSON.parse(raw)
    }catch(e){
      cartData = []
    }

    // Find or create user's cart
    let userCart = cartData.find(c => c.email === session.user.email)
    if(!userCart){
      userCart = {
        email: session.user.email,
        userId: session.user.id,
        items: []
      }
      cartData.push(userCart)
    }

    // Check if item already in cart
    const existingItem = userCart.items.find(item => item.listingId === listingId)
    if(existingItem){
      return res.status(200).json({ success: true, message: 'Item already in cart' })
    }

    // Add item to cart
    userCart.items.push({
      listingId,
      addedAt: new Date().toISOString()
    })

    // Save cart
    await fs.writeFile(cartPath, JSON.stringify(cartData, null, 2))

    return res.status(200).json({ success: true })
  }catch(e){
    console.error('Add to cart failed:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
