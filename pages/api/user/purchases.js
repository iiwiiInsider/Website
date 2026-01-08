import { promises as fs } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth/next'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { authOptions } from '../auth/[...nextauth]'
import { appendAudit } from '../../../lib/audit'
import { sendPurchaseAgreementEmail } from '../../../lib/email'

const PURCHASES_FILE = path.join(process.cwd(), 'data', 'purchases.json')

const ALLOWED_STATUSES = ['pending', 'accepted', 'rejected', 'completed']

async function readPurchases() {
  const raw = await fs.readFile(PURCHASES_FILE, 'utf8').catch(() => '[]')
  try {
    return JSON.parse(raw || '[]')
  } catch {
    return []
  }
}

async function writePurchases(data) {
  await fs.mkdir(path.dirname(PURCHASES_FILE), { recursive: true })
  await fs.writeFile(PURCHASES_FILE, JSON.stringify(data, null, 2))
}

function safeText(value, max = 180) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

async function generatePurchasePdf(purchase, details) {
  const {
    propertyAddress,
    propertyDetails,
    landTaxRate,
    landTaxAmount,
    closingDate,
    agentEmail
  } = details || {}

  const ratePercent = Number(landTaxRate) || 0
  const taxAmount = Number.isFinite(Number(landTaxAmount))
    ? Number(landTaxAmount)
    : Math.round((purchase.listingPrice || 0) * (ratePercent / 100))

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const margin = 48
  let y = 792 - margin

  const drawText = (text, size = 11, bold = false, color = rgb(0.08, 0.11, 0.16)) => {
    page.drawText(String(text || ''), {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color
    })
    y -= size + 6
  }

  const drawRow = (label, value) => {
    page.drawText(label, { x: margin, y, size: 10, font: fontBold, color: rgb(0.20, 0.26, 0.34) })
    page.drawText(String(value || '-'), { x: margin + 140, y, size: 10, font, color: rgb(0.08, 0.11, 0.16) })
    y -= 16
  }

  drawText('Purchase Acceptance', 18, true)
  drawText(`Property ${purchase.propertyId}`, 13, true, rgb(0.02, 0.23, 0.85))
  y -= 4

  drawRow('Buyer', purchase.buyerEmail)
  drawRow('Listing Agent', agentEmail || purchase.agentEmail)
  drawRow('Property address', safeText(propertyAddress || '', 160))
  drawRow('Details', safeText(propertyDetails || '', 160))
  drawRow('Closing date', closingDate || 'TBD')

  y -= 4
  page.drawLine({ start: { x: margin, y }, end: { x: 612 - margin, y }, thickness: 1, color: rgb(0.90, 0.92, 0.95) })
  y -= 16

  drawText('Financial Summary', 12, true)
  drawRow('Asking price', `R${(purchase.listingPrice || 0).toLocaleString()}`)
  drawRow('Buyer offer', `R${(purchase.offeredPrice || 0).toLocaleString()}`)
  drawRow('Land tax rate', `${ratePercent}%`)
  drawRow('Estimated land tax', `R${taxAmount.toLocaleString()}`)

  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: 612 - margin, y }, thickness: 1, color: rgb(0.90, 0.92, 0.95) })
  y -= 16

  drawText('Signatures', 12, true)
  drawRow('Buyer signature', '________________________')
  drawRow('Agent signature', '________________________')
  drawRow('Date', '________________________')

  y = Math.max(y, margin + 28)
  page.drawText(`Generated ${new Date().toISOString()}`, {
    x: margin,
    y: margin - 8,
    size: 8,
    font,
    color: rgb(0.45, 0.51, 0.60)
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()
  const isAdmin = email === 'admin@local.test'

  if (!email) return res.status(401).json({ error: 'Unauthorized' })

  // GET: List purchases
  if (req.method === 'GET') {
    try {
      const purchases = await readPurchases()
      const role = String(req.query?.role || '').toLowerCase()

      if (role === 'agent') {
        const agentPurchases = purchases.filter(p => p.agentEmail === email)
        return res.status(200).json({ ok: true, purchases: agentPurchases })
      }

      if (role === 'admin' && isAdmin) {
        return res.status(200).json({ ok: true, purchases })
      }

      const userPurchases = purchases.filter(p => p.buyerEmail === email)
      return res.status(200).json({ ok: true, purchases: userPurchases })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to load purchases' })
    }
  }

  // POST: Create purchase offer
  if (req.method === 'POST') {
    try {
      const { propertyId, listingPrice, offeredPrice, agentEmail, notes } = req.body || {}

      if (!propertyId || !listingPrice || !offeredPrice || !agentEmail) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const offeredPriceNum = Number(offeredPrice)
      const listingPriceNum = Number(listingPrice)

      if (offeredPriceNum < listingPriceNum * 0.5) {
        return res.status(400).json({ error: 'Offer too low - must be at least 50% of asking price' })
      }

      if (offeredPriceNum > listingPriceNum * 1.15) {
        return res.status(400).json({ error: 'Offer exceeds maximum allowed (115% of asking price)' })
      }

      const purchase = {
        id: `purch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        propertyId: String(propertyId),
        listingPrice: listingPriceNum,
        offeredPrice: offeredPriceNum,
        agentEmail: String(agentEmail).toLowerCase(),
        buyerEmail: email,
        notes: String(notes || '').slice(0, 500),
        status: 'pending', // pending, accepted, rejected, completed
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }

      const purchases = await readPurchases()
      purchases.push(purchase)
      await writePurchases(purchases)

      await appendAudit({
        actorEmail: email,
        action: 'PURCHASE_OFFER_CREATED',
        targetType: 'purchase',
        targetId: purchase.id,
        data: {
          propertyId,
          listingPrice: listingPriceNum,
          offeredPrice: offeredPriceNum,
          agentEmail
        }
      })

      return res.status(201).json({ ok: true, purchase })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to create purchase offer' })
    }
  }

  // PUT: Update purchase status (admin/agent only)
  if (req.method === 'PUT') {
    try {
      const { purchaseId, status, propertyAddress, landTaxRate, landTaxAmount, closingDate, propertyDetails } = req.body || {}

      if (!purchaseId || !status) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      if (!ALLOWED_STATUSES.includes(String(status))) {
        return res.status(400).json({ error: 'Invalid status' })
      }

      const purchases = await readPurchases()
      const purchase = purchases.find(p => p.id === purchaseId)

      if (!purchase) {
        return res.status(404).json({ error: 'Purchase not found' })
      }

      // Only agent or admin can update
      const isAgent = purchase.agentEmail === email

      if (!isAdmin && !isAgent) {
        return res.status(403).json({ error: 'Not authorized to update this purchase' })
      }

      purchase.status = status
      purchase.updatedAt = new Date().toISOString()

      if (propertyAddress) purchase.propertyAddress = safeText(propertyAddress, 240)
      if (propertyDetails) purchase.propertyDetails = safeText(propertyDetails, 400)

      if (status === 'accepted') {
        purchase.acceptedAt = new Date().toISOString()
        purchase.acceptedBy = email
        purchase.landTaxRate = Number(landTaxRate) || 0
        purchase.landTaxAmount = Number.isFinite(Number(landTaxAmount))
          ? Number(landTaxAmount)
          : Math.round((purchase.listingPrice || 0) * ((Number(landTaxRate) || 0) / 100))
        purchase.closingDate = closingDate || ''

        try {
          const pdfBuffer = await generatePurchasePdf(purchase, {
            propertyAddress,
            propertyDetails,
            landTaxRate,
            landTaxAmount,
            closingDate,
            agentEmail: email
          })

          await sendPurchaseAgreementEmail({
            toEmail: purchase.buyerEmail,
            buyerEmail: purchase.buyerEmail,
            agentEmail: email,
            propertyId: purchase.propertyId,
            propertyAddress,
            offeredPrice: purchase.offeredPrice,
            listingPrice: purchase.listingPrice,
            landTaxRate: Number(landTaxRate) || 0,
            landTaxAmount: purchase.landTaxAmount,
            closingDate,
            pdfBuffer
          })
        } catch (err) {
          console.error('Purchase acceptance email failed', err)
        }
      }

      if (status === 'completed') {
        purchase.completedAt = new Date().toISOString()
      }

      await writePurchases(purchases)

      await appendAudit({
        actorEmail: email,
        action: 'PURCHASE_STATUS_UPDATED',
        targetType: 'purchase',
        targetId: purchaseId,
        data: { status, propertyAddress: purchase.propertyAddress, landTaxRate, landTaxAmount, closingDate }
      })

      return res.status(200).json({ ok: true, purchase })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to update purchase' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
