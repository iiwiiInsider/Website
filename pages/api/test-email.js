import { sendWelcomeEmail } from '../../lib/email'

export default async function handler(req, res){
  const to = req.query.to || req.body?.to
  if(!to){
    return res.status(400).json({error: 'Provide ?to=you@example.com'})
  }

  try{
    await sendWelcomeEmail(to, null, process.env.BUSINESS_NAME || 'Business')
    return res.json({ok:true, message:`Sent test welcome email to ${to}`})
  }catch(e){
    console.error('Test email failed', e)
    return res.status(500).json({ok:false, error: e.message || 'Failed'})
  }
}
