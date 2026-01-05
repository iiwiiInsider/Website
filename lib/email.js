import nodemailer from 'nodemailer'

export async function sendWelcomeEmail(toEmail, userName, businessName){
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if(!user || !pass) {
    console.warn('Gmail credentials not configured. Skipping email.')
    return
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  })

  const html = `
    <div>
      <h2>Welcome to ${businessName}</h2>
      <p>Hello ${userName || ''},</p>
      <p>Thanks for signing in to ${businessName}. You can now explore and list properties in Cape Town.</p>
      <p>— ${businessName} team</p>
    </div>
  `

  try{
    const info = await transporter.sendMail({
      from: user,
      to: toEmail,
      subject: `Welcome to ${businessName}`,
      html
    })
    console.info('Welcome email sent', { to: toEmail, messageId: info.messageId })
  }catch(err){
    console.error('Error sending welcome email', err)
    throw err
  }
}
