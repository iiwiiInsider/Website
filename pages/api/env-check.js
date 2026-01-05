export default function handler(req,res){
  res.json({
    GOOGLE_CONFIGURED: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    APPLE_CONFIGURED: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
    GMAIL_CONFIGURED: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL
  })
}
