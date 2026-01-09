import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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
    const { listingType, title, description, neighborhood, city, price, imageDataUrl, imageGallery } = req.body

    if(!title || !price){
      return res.status(400).json({ error: 'Title and price are required' })
    }

    const gallery = Array.isArray(imageGallery) ? imageGallery.filter(Boolean).slice(0, 5) : []
    const primaryImage = gallery[0] || imageDataUrl || null

    // Generate unique ID for admin-created listings
    const listingId = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

    const newListing = {
      id: listingId,
      listingType: listingType || 'buy',
      title: String(title).trim(),
      description: String(description || '').trim(),
      neighborhood: String(neighborhood || '').trim(),
      city: String(city || '').trim() || 'Cape Town',
      price: Number(price) || 0,
      imageDataUrl: primaryImage,
      imageGallery: gallery,
      createdAt: new Date().toISOString(),
      createdBy: 'admin@local.test'
    }

    // Load existing listings
    const listingsPath = path.join(process.cwd(), 'data', 'listings.json')
    let listings = []
    
    try{
      const raw = await fs.readFile(listingsPath, 'utf8')
      listings = JSON.parse(raw || '[]')
    }catch(e){
      listings = []
    }

    // Add new listing
    listings.push(newListing)

    // Save updated listings
    await fs.writeFile(listingsPath, JSON.stringify(listings, null, 2))

    return res.status(201).json({ 
      success: true, 
      listing: newListing,
      message: 'Listing created successfully' 
    })

  }catch(e){
    console.error('Error creating listing:', e)
    return res.status(500).json({ error: 'Failed to create listing: ' + (e.message || 'Unknown error') })
  }
}
