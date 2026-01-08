/*
  Notify previously registered users about account removal due to data tests.
  - Reads prior commit's data/users.json via git
  - Sends an email to each unique user email using lib/email.js

  Requirements:
  - Env vars: GMAIL_USER, GMAIL_APP_PASSWORD (Gmail App Password)
*/
const { execSync } = require('child_process')

async function main(){
  // Setup nodemailer transporter (CommonJS)
  const nodemailer = require('nodemailer')

  let prevJson = '[]'
  try{
    prevJson = execSync('git show HEAD~1:data/users.json', { encoding: 'utf8' })
  }catch(e){
    console.error('Could not read previous users.json from git history:', e.message)
  }

  let users = []
  try{
    users = JSON.parse(prevJson)
  }catch(e){
    console.error('Failed to parse previous users.json content:', e.message)
  }

  const emails = Array.from(new Set((users || []).map(u => String(u.email || '').trim()).filter(Boolean)))
  if(emails.length === 0){
    console.log('No prior user emails found to notify.')
    return
  }

  const transporter = (function(){
    const user = process.env.GMAIL_USER || process.env.NOTIFY_FROM_EMAIL
    const pass = process.env.GMAIL_APP_PASSWORD
    if(!user || !pass){
      console.warn('Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.')
      return null
    }
    return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
  })()

  if(!transporter){
    console.log('Skipping email send due to missing credentials.')
    return
  }

  const from = process.env.NOTIFY_FROM_EMAIL || process.env.GMAIL_USER

  const sendOne = async (toEmail) => {
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f172a;line-height:1.6;background:#f8fafc;padding:24px;">
        <div style="max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
          <h2 style="color:#7c3aed;margin:0 0 12px;font-size:22px;">Account removal notice</h2>
          <p style="margin:0 0 12px;">Hello,</p>
          <p style="margin:0 0 12px;">Your account has been removed as part of data testing and cleanup on the BurnProjects Marketplace.</p>
          <p style="margin:0 0 12px;">No further action is required on your side. If you would like to re-register, you can visit the site at <a href="https://website-murex-rho-80.vercel.app/">our live site</a>.</p>
          <p style="margin:0;color:#475569;font-size:13px;">If you believe this was in error, please contact support@burnprojects.com.</p>
        </div>
      </div>
    `

    const opts = {
      from,
      to: toEmail,
      subject: 'BurnProjects Marketplace - Account removal due to data tests',
      html
    }
    try{
      const info = await transporter.sendMail(opts)
      console.log('Sent removal notice to', toEmail, 'messageId:', info.messageId)
    }catch(err){
      console.error('Failed to send to', toEmail, err.message)
    }
  }

  for(const email of emails){
    await sendOne(email)
  }

  console.log('Notification complete. Total recipients:', emails.length)
}

main().catch(err => {
  console.error('Unexpected error in notifier:', err)
  process.exitCode = 1
})
