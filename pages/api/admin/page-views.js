import { promises as fs } from 'fs'
import path from 'path'

export default async function handler(req, res){
  if(req.method !== 'GET'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try{
    const pageViewsPath = path.join(process.cwd(), 'data', 'pageViews.json')
    
    let pageViews = []
    try{
      const raw = await fs.readFile(pageViewsPath, 'utf8')
      if(raw){
        pageViews = JSON.parse(raw)
      }
    }catch(e){
      // File doesn't exist yet or is invalid
      console.error('Error parsing pageViews.json:', e.message)
      pageViews = []
    }

    return res.status(200).json({ pageViews })
  }catch(e){
    console.error('Failed to load page views:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
