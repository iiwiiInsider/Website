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
    // Get all listings
    try{
      const listingsPath = path.join(process.cwd(), 'data', 'listings.json')
      const raw = await fs.readFile(listingsPath, 'utf8')
      const listings = JSON.parse(raw || '[]')
      
      return res.status(200).json({ listings })
    }catch(e){
      return res.status(500).json({ error: 'Failed to load listings' })
    }
  }

  if(req.method === 'DELETE'){
    // Delete a listing
    try{
      const { listingId } = req.body
      
      if(!listingId){
        return res.status(400).json({ error: 'Missing listingId' })
      }

      const listingsPath = path.join(process.cwd(), 'data', 'listings.json')
      const raw = await fs.readFile(listingsPath, 'utf8')
      const listings = JSON.parse(raw || '[]')
      
      const updatedListings = listings.filter(l => l.id !== listingId)
      
      await fs.writeFile(listingsPath, JSON.stringify(updatedListings, null, 2))
      
      return res.status(200).json({ success: true })
    }catch(e){
      return res.status(500).json({ error: 'Failed to delete listing' })
    }
  }

  if(req.method === 'PUT'){
    // Update a listing
    try{
      const { listingId, updates } = req.body
      
      if(!listingId || !updates){
        return res.status(400).json({ error: 'Missing listingId or updates' })
      }

      const listingsPath = path.join(process.cwd(), 'data', 'listings.json')
      const raw = await fs.readFile(listingsPath, 'utf8')
      const listings = JSON.parse(raw || '[]')
      
      const listingIndex = listings.findIndex(l => l.id === listingId)
      
      if(listingIndex === -1){
        return res.status(404).json({ error: 'Listing not found' })
      }

      listings[listingIndex] = {
        ...listings[listingIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      await fs.writeFile(listingsPath, JSON.stringify(listings, null, 2))
      
      return res.status(200).json({ success: true, listing: listings[listingIndex] })
    }catch(e){
      return res.status(500).json({ error: 'Failed to update listing' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
