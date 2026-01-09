import nodemailer from 'nodemailer'

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'kdbburns.social@gmail.com'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'kdbburns.social@gmail.com'

function getTransporter(){
  const user = process.env.GMAIL_USER || FROM_EMAIL
  const pass = process.env.GMAIL_APP_PASSWORD
  if(!user || !pass){
    console.warn('Gmail credentials not configured. Skipping email send.')
    return null
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  })
}

export async function sendAccountCreatedEmail(toEmail, userName){
  const transporter = getTransporter()
  if(!transporter) return

  const name = userName || 'there'
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f172a;line-height:1.6;background:#f8fafc;padding:24px;">
      <div style="max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
        <h2 style="color:#7c3aed;margin:0 0 12px;font-size:22px;">Welcome to Marketplace</h2>
        <p style="margin:0 0 12px;">Hi ${name},</p>
        <p style="margin:0 0 12px;">Your account has been created successfully. You can now sign in and start browsing the market.</p>
        <p style="margin:0 0 16px;">If you did not request this account, please secure your email and contact support.</p>
        <a href="${process.env.NEXTAUTH_URL || ''}/login" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Go to login</a>
        <p style="margin:16px 0 0;color:#475569;font-size:13px;">Thank you for choosing us.</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'Your account is ready',
    html
  })
}

export async function sendAdminAccountCreatedEmail({ user }){
  const transporter = getTransporter()
  if(!transporter) return
  const createdAt = user?.createdAt || new Date().toISOString()
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">
      <h3 style="color:#7c3aed;margin:0 0 8px;">New account created</h3>
      <ul style="padding-left:16px;margin:0 0 12px;">
        <li><strong>Email:</strong> ${user?.email || 'n/a'}</li>
        <li><strong>Name:</strong> ${user?.name || 'n/a'}</li>
        <li><strong>Role:</strong> ${user?.role || 'buyer'}</li>
        <li><strong>User ID:</strong> ${user?.id || 'n/a'}</li>
        <li><strong>Created:</strong> ${createdAt}</li>
      </ul>
      <p style="margin:0;color:#475569;">This is an automated notification.</p>
    </div>
  `

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: 'New user account created',
    html
  })
}

export async function sendAdminLoginEmail({ user, source }){
  const transporter = getTransporter()
  if(!transporter) return
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">
      <h3 style="color:#7c3aed;margin:0 0 8px;">User login detected</h3>
      <ul style="padding-left:16px;margin:0 0 12px;">
        <li><strong>Email:</strong> ${user?.email || 'n/a'}</li>
        <li><strong>Name:</strong> ${user?.name || 'n/a'}</li>
        <li><strong>Role:</strong> ${user?.role || 'buyer'}</li>
        <li><strong>User ID:</strong> ${user?.id || 'n/a'}</li>
        <li><strong>Created:</strong> ${user?.createdAt || 'n/a'}</li>
        <li><strong>Source:</strong> ${source || 'credentials'}</li>
        <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
      </ul>
      <p style="margin:0;color:#475569;">This is an automated notification for security awareness.</p>
    </div>
  `

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: 'User login notification',
    html
  })
}

export async function sendAccountDeletionCode({ toEmail, code }){
  const transporter = getTransporter()
  if(!transporter) return

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f172a;line-height:1.6;background:#f8fafc;padding:24px;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
        <h2 style="color:#7c3aed;margin:0 0 12px;font-size:20px;">Confirm account deletion</h2>
        <p style="margin:0 0 12px;">Enter this <strong>6-digit verification code</strong> to continue. The code expires in 15 minutes.</p>
        <div style="font-size:26px;font-weight:800;letter-spacing:6px;color:#0f172a;margin:12px 0;">${code}</div>
        <p style="margin:0 0 12px;color:#475569;font-size:13px;">If you did not request this, ignore this email. Your account will remain active.</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'Your 6-digit verification code',
    html
  })
}

export async function sendAccountVerificationCode({ toEmail, code }){
  const transporter = getTransporter()
  if(!transporter) return

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f172a;line-height:1.6;background:#f8fafc;padding:24px;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
        <h2 style="color:#7c3aed;margin:0 0 12px;font-size:20px;">Verify your account</h2>
        <p style="margin:0 0 12px;">Enter this <strong>6-digit code</strong> to verify your email. The code expires in 15 minutes.</p>
        <div style="font-size:26px;font-weight:800;letter-spacing:6px;color:#0f172a;margin:12px 0;">${code}</div>
        <p style="margin:0 0 12px;color:#475569;font-size:13px;">If you did not request this, you can ignore this email.</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'Your verification code',
    html
  })
}

// Legacy helper retained for compatibility
export async function sendWelcomeEmail(toEmail, userName, businessName){
  await sendAccountCreatedEmail(toEmail, userName || businessName || 'there')
}

export async function sendPurchaseAgreementEmail({
  toEmail,
  buyerEmail,
  agentEmail,
  propertyId,
  propertyAddress,
  offeredPrice,
  listingPrice,
  landTaxRate,
  landTaxAmount,
  closingDate,
  pdfBuffer
}){
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if(!user || !pass){
    console.warn('Gmail credentials not configured. Skipping purchase email.')
    return
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  })

  const subject = `Purchase acceptance for property ${propertyId}`
  const html = `
    <div>
      <h2>Purchase Accepted</h2>
      <p>Hello,</p>
      <p>Your offer has been accepted for property <strong>${propertyId}</strong>.</p>
      <ul>
        <li>Property address: ${propertyAddress || 'Not provided'}</li>
        <li>Listing price: R${Number(listingPrice || 0).toLocaleString()}</li>
        <li>Your offer: R${Number(offeredPrice || 0).toLocaleString()}</li>
        <li>Land tax rate: ${Number(landTaxRate || 0)}%</li>
        <li>Estimated land tax: R${Number(landTaxAmount || 0).toLocaleString()}</li>
        <li>Closing date: ${closingDate || 'To be confirmed'}</li>
      </ul>
      <p>The attached PDF includes signature lines. Please review and sign.</p>
      <p>Agent: ${agentEmail || 'N/A'}</p>
    </div>
  `

  try{
    const info = await transporter.sendMail({
      from: user,
      to: toEmail,
      subject,
      html,
      attachments: [
        {
          filename: `purchase-${propertyId || 'listing'}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })
    console.info('Purchase agreement email sent', { to: toEmail, messageId: info.messageId, buyerEmail, agentEmail })
  }catch(err){
    console.error('Error sending purchase agreement email', err)
    throw err
  }
}
