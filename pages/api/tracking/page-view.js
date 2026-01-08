import { promises as fs } from 'fs'
import path from 'path'

export default async function handler(req, res){
  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try{
    const { email, userId, page, referrer, userAgent, timestamp } = req.body

    if(!email || !page){
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const pageViewsPath = path.join(process.cwd(), 'data', 'pageViews.json')
    
    // Read existing page views
    let pageViews = []
    try{
      const raw = await fs.readFile(pageViewsPath, 'utf8')
      pageViews = JSON.parse(raw)
    }catch(e){
      // File doesn't exist yet, start with empty array
      pageViews = []
    }

    // Add new page view
    const pageView = {
      email,
      userId: userId || null,
      page,
      referrer: referrer || null,
      userAgent: userAgent || null,
      timestamp: timestamp || new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || null
    }

    pageViews.push(pageView)

    // Keep only last 10000 page views to prevent file from growing too large
    if(pageViews.length > 10000){
      pageViews = pageViews.slice(-10000)
    }

    // Write back to file
    await fs.writeFile(pageViewsPath, JSON.stringify(pageViews, null, 2))

    return res.status(200).json({ success: true })
  }catch(e){
    console.error('Page view tracking failed:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
