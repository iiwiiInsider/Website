import { promises as fs } from 'fs'
import path from 'path'

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})
  try{
    const body = req.body || {}
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0]
    const ts = new Date().toISOString()
    const record = {
      email: body.email || null,
      userId: body.userId || null,
      loggedIn: !!body.loggedIn,
      userAgent: body.userAgent || req.headers['user-agent'] || null,
      platform: body.platform || null,
      screen: body.screen || null,
      innerSize: body.innerSize || null,
      language: body.language || null,
      ip,
      time: ts,
      source: body.source || 'client'
    }

    const file = path.join(process.cwd(), 'data', 'logins.json')
    const raw = await fs.readFile(file, 'utf8').catch(()=> '{}')
    let logs
    try{
      logs = JSON.parse(raw || '{"anonymous":[],"authenticated":[]}')
    }catch{
      logs = { anonymous: [], authenticated: [] }
    }
    if(record.loggedIn){
      logs.authenticated = logs.authenticated || []
      logs.authenticated.push(record)
    }else{
      logs.anonymous = logs.anonymous || []
      logs.anonymous.push(record)
    }
    // keep last 1000 entries each to avoid runaway file growth
    logs.authenticated = (logs.authenticated || []).slice(-1000)
    logs.anonymous = (logs.anonymous || []).slice(-1000)
    await fs.writeFile(file, JSON.stringify(logs, null, 2))
    res.status(200).json({ok:true})
  }catch(e){
    console.error('tracking/login error', e)
    res.status(500).json({error:'Failed to record tracking'})
  }
}
