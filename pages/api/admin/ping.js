export default async function handler(req, res){
  if(req.method !== 'GET'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check if request is from localhost
  const host = req.headers.host || ''
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]')

  if(!isLocalhost){
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Admin ping only available on localhost'
    })
  }

  // Return ping response
  return res.status(200).json({
    status: 'online',
    message: 'Admin server online',
    timestamp: new Date().toISOString(),
    environment: 'localhost',
    version: '1.0.0'
  })
}
