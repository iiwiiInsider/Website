import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export default async function handler(req, res){
  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').toLowerCase()
  if(!email){
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try{
    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `BurnProjects (${email})`,
      issuer: 'BurnProjects',
      length: 32
    })

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url)

    return res.status(200).json({
      ok: true,
      secret: secret.base32,
      qrCode
    })
  }catch(e){
    console.error('2fa-setup error', e)
    return res.status(500).json({ error: 'Failed to generate 2FA setup' })
  }
}
