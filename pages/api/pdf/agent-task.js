import { getServerSession } from 'next-auth/next'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { authOptions } from '../auth/[...nextauth]'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
}

function isValidEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase())
}

function safeText(value, max = 200){
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function safeMultiline(value, max = 800){
  return String(value || '').replace(/\r\n/g, '\n').trim().slice(0, max)
}

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()
  if(!email) return res.status(401).json({ error: 'Unauthorized' })
  if(!isValidEmail(email)) return res.status(400).json({ error: 'Valid user email required' })

  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    title,
    assignedToEmail,
    timeZone,
    dueDate,
    priority,
    fields
  } = req.body || {}

  const assigned = safeText(assignedToEmail || email, 120)
  const safeTitle = safeText(title || 'Agent Task', 120)
  const tz = safeText(timeZone || '', 80)
  const due = safeText(dueDate || '', 60)
  const pr = safeText(priority || 'normal', 20)

  const f = fields && typeof fields === 'object' && !Array.isArray(fields) ? fields : {}

  const clientName = safeText(f.clientName || '', 120)
  const clientEmail = safeText(f.clientEmail || '', 120)
  const clientPhone = safeText(f.clientPhone || '', 60)
  const propertyId = safeText(f.propertyId || '', 60)
  const listingTitle = safeText(f.listingTitle || '', 120)
  const instructions = safeMultiline(f.instructions || '', 800)
  const notes = safeMultiline(f.notes || '', 800)

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const margin = 48
  let y = 792 - margin

  const drawText = (text, size = 11, opts = {}) => {
    page.drawText(String(text || ''), {
      x: margin,
      y,
      size,
      font: opts.bold ? fontBold : font,
      color: opts.color || rgb(0.08, 0.11, 0.16)
    })
    y -= (size + 6)
  }

  const drawLabelValue = (label, value) => {
    page.drawText(label, { x: margin, y, size: 10, font: fontBold, color: rgb(0.20, 0.26, 0.34) })
    page.drawText(value || '-', { x: margin + 120, y, size: 10, font, color: rgb(0.08, 0.11, 0.16) })
    y -= 18
  }

  drawText('Agent Assignment — Required Task', 18, { bold: true })
  drawText(safeTitle, 13, { bold: true, color: rgb(0.02, 0.23, 0.85) })
  y -= 6

  drawLabelValue('Assigned to', assigned)
  drawLabelValue('Created by', email)
  drawLabelValue('Priority', pr)
  if(due) drawLabelValue('Due', due)
  if(tz) drawLabelValue('Timezone', tz)

  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: 612 - margin, y }, thickness: 1, color: rgb(0.90, 0.92, 0.95) })
  y -= 18

  drawText('Client / Listing', 12, { bold: true })
  drawLabelValue('Client name', clientName)
  drawLabelValue('Client email', clientEmail)
  drawLabelValue('Client phone', clientPhone)
  drawLabelValue('Property ID', propertyId)
  drawLabelValue('Listing title', listingTitle)

  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: 612 - margin, y }, thickness: 1, color: rgb(0.90, 0.92, 0.95) })
  y -= 18

  const drawMultilineBlock = (label, text) => {
    page.drawText(label, { x: margin, y, size: 12, font: fontBold, color: rgb(0.20, 0.26, 0.34) })
    y -= 16

    const maxWidth = 612 - margin * 2
    const size = 10
    const lineHeight = 14

    const words = String(text || '').split(/\s+/).filter(Boolean)
    let line = ''
    const lines = []

    for(const word of words){
      const test = line ? `${line} ${word}` : word
      const w = font.widthOfTextAtSize(test, size)
      if(w > maxWidth){
        if(line) lines.push(line)
        line = word
      }else{
        line = test
      }
    }
    if(line) lines.push(line)

    const maxLines = 12
    const safeLines = lines.slice(0, maxLines)

    for(const ln of safeLines){
      if(y < margin + 60) break
      page.drawText(ln, { x: margin, y, size, font, color: rgb(0.08, 0.11, 0.16) })
      y -= lineHeight
    }

    y -= 12
  }

  if(instructions) drawMultilineBlock('Instructions', instructions)
  if(notes) drawMultilineBlock('Notes', notes)

  y = Math.max(y, margin + 24)
  page.drawText(`Generated: ${new Date().toISOString()}`, {
    x: margin,
    y: margin - 6,
    size: 8,
    font,
    color: rgb(0.45, 0.51, 0.60)
  })

  const pdfBytes = await pdfDoc.save()
  const filename = `agent-task-${Date.now()}.pdf`

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  return res.status(200).send(Buffer.from(pdfBytes))
}
