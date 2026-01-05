import { getServerSession } from 'next-auth/next'
import { promises as fs } from 'fs'
import path from 'path'
import { authOptions } from '../auth/[...nextauth]'
import { ALLOWED_NEIGHBORHOODS } from '../../../lib/neighborhoods'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
}

const LISTINGS_FILE = path.join(process.cwd(), 'data', 'marketListings.json')
const SUPPORTED_CURRENCIES = ['ZAR','USD','EUR','GBP','AUD','CAD','NZD','CHF','JPY','CNY','INR']
const MAX_IMAGE_BYTES = 1_000_000
const MAX_IMAGES = 15

function validateImageDataUrl(dataUrl){
  if(!dataUrl) return null
  const s = String(dataUrl)
  const m = s.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i)
  if(!m) return 'Image must be a PNG, JPG, or WEBP'
  const base64 = m[2] || ''
  if(!base64) return 'Image data is empty'
  const approxBytes = Math.floor((base64.length * 3) / 4)
  if(approxBytes > MAX_IMAGE_BYTES) return 'Image must be 1MB or smaller'
  return null
}

function validateImageDataUrls(list){
  if(list == null) return null
  if(!Array.isArray(list)) return 'Images must be an array'
  if(list.length > MAX_IMAGES) return `Maximum ${MAX_IMAGES} photos allowed`
  for(const item of list){
    if(!item) continue
    const err = validateImageDataUrl(item)
    if(err) return err
  }
  return null
}

function normalizeImageDataUrls(list){
  if(!Array.isArray(list)) return []
  return list
    .filter(Boolean)
    .map(x => String(x))
    .slice(0, MAX_IMAGES)
}

// Approximate conversion rates from ZAR for display-only.
// When a user posts in another currency, we convert back to ZAR for storage.
const ZAR_TO = {
  ZAR: 1,
  USD: 0.055,
  EUR: 0.05,
  GBP: 0.043,
  AUD: 0.083,
  CAD: 0.074,
  NZD: 0.09,
  CHF: 0.05,
  JPY: 8.1,
  CNY: 0.39,
  INR: 4.6
}

function normalizeCurrencyCode(code){
  const c = String(code || 'ZAR').trim().toUpperCase()
  return SUPPORTED_CURRENCIES.includes(c) ? c : 'ZAR'
}

function convertToZar(amount, currencyCode){
  const c = normalizeCurrencyCode(currencyCode)
  const rate = ZAR_TO[c] || 1
  const n = Number(amount)
  if(!Number.isFinite(n)) return 0
  if(rate === 0) return 0
  return n / rate
}

async function readListings(){
  const raw = await fs.readFile(LISTINGS_FILE, 'utf8').catch(()=> '[]')
  try{
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  }catch{
    return []
  }
}

async function writeListings(listings){
  await fs.mkdir(path.dirname(LISTINGS_FILE), { recursive: true })
  await fs.writeFile(LISTINGS_FILE, JSON.stringify(listings, null, 2))
}

function isValidEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase())
}

export default async function handler(req, res){
  if(req.method === 'GET'){
    const listings = await readListings()
    return res.status(200).json({ ok: true, listings })
  }

  if(req.method === 'DELETE'){
    const session = await getServerSession(req, res, authOptions)
    const email = String(session?.user?.email || '').trim().toLowerCase()
    if(!email) return res.status(401).json({ error: 'Unauthorized' })
    if(!isValidEmail(email)) return res.status(400).json({ error: 'Valid user email required' })

    const idFromQuery = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id
    const idFromBody = req.body?.id
    const listingId = String(idFromQuery || idFromBody || '').trim()
    if(!listingId) return res.status(400).json({ error: 'id required' })

    const listings = await readListings()
    const idx = listings.findIndex(x => String(x?.id) === listingId)
    if(idx === -1) return res.status(404).json({ error: 'Listing not found' })

    const listing = listings[idx] || {}
    const ownerEmail = String(listing?.ownerEmail || '').trim().toLowerCase()

    const isAdmin = email === 'admin@local.test'
    if(!isAdmin && ownerEmail !== email) return res.status(403).json({ error: 'Forbidden' })

    listings.splice(idx, 1)
    await writeListings(listings)
    return res.status(200).json({ ok: true })
  }

  if(req.method === 'PUT'){
    const session = await getServerSession(req, res, authOptions)
    const email = String(session?.user?.email || '').trim().toLowerCase()
    if(!email) return res.status(401).json({ error: 'Unauthorized' })
    if(!isValidEmail(email)) return res.status(400).json({ error: 'Valid user email required' })

    const {
      id,
      listingType,
      title,
      description,
      neighborhood,
      city,
      price,
      currency,
      imageDataUrl,
      imageDataUrls
    } = req.body || {}

    const listingId = String(id || '').trim()
    if(!listingId) return res.status(400).json({ error: 'id required' })

    const listings = await readListings()
    const idx = listings.findIndex(x => String(x?.id) === listingId)
    if(idx === -1) return res.status(404).json({ error: 'Listing not found' })

    const existing = listings[idx] || {}
    const ownerEmail = String(existing?.ownerEmail || '').trim().toLowerCase()
    const isAdmin = email === 'admin@local.test'
    if(!isAdmin && ownerEmail !== email) return res.status(403).json({ error: 'Forbidden' })

    const lt = String(listingType || '').trim().toLowerCase()
    if(lt !== 'buy' && lt !== 'sell') return res.status(400).json({ error: 'listingType must be buy or sell' })

    const safeTitle = String(title || '').trim()
    const safeDescription = String(description || '').trim()
    const safeNeighborhood = String(neighborhood || '').trim()
    const safeCity = String(city || '').trim() || 'Cape Town'
    const currencyCode = normalizeCurrencyCode(currency)
    const inputPrice = Number(price)
    const zarPrice = convertToZar(inputPrice, currencyCode)

    if(!safeTitle) return res.status(400).json({ error: 'Title required' })
    if(safeTitle.length > 60) return res.status(400).json({ error: 'Title must be 60 characters or less' })
    if(!safeDescription) return res.status(400).json({ error: 'Description required' })
    if(safeDescription.length > 250) return res.status(400).json({ error: 'Description must be 250 characters or less' })
    if(!safeNeighborhood) return res.status(400).json({ error: 'Neighborhood required' })
    if(!ALLOWED_NEIGHBORHOODS.includes(safeNeighborhood)) return res.status(400).json({ error: 'Neighborhood must be selected from the list' })
    if(!Number.isFinite(inputPrice) || inputPrice <= 0) return res.status(400).json({ error: 'Valid price required' })
    if(!Number.isFinite(zarPrice) || zarPrice <= 0) return res.status(400).json({ error: 'Valid price required' })

    const hasImagesUpdate = Object.prototype.hasOwnProperty.call((req.body || {}), 'imageDataUrls')
    const hasImageUpdate = Object.prototype.hasOwnProperty.call((req.body || {}), 'imageDataUrl')
    if(hasImagesUpdate){
      const imagesError = validateImageDataUrls(imageDataUrls)
      if(imagesError) return res.status(400).json({ error: imagesError })
    }else if(hasImageUpdate){
      const imageError = validateImageDataUrl(imageDataUrl)
      if(imageError) return res.status(400).json({ error: imageError })
    }

    const existingImages = Array.isArray(existing?.imageDataUrls) ? existing.imageDataUrls : (existing?.imageDataUrl ? [existing.imageDataUrl] : [])
    const updatedImages = hasImagesUpdate
      ? normalizeImageDataUrls(imageDataUrls)
      : hasImageUpdate
        ? (imageDataUrl ? [String(imageDataUrl)] : [])
        : existingImages
    const primaryImage = updatedImages[0] || null

    listings[idx] = {
      ...existing,
      listingType: lt,
      title: safeTitle,
      description: safeDescription,
      neighborhood: safeNeighborhood,
      city: safeCity,
      price: zarPrice,
      priceInput: inputPrice,
      currency: currencyCode,
      imageDataUrls: updatedImages,
      imageDataUrl: primaryImage,
      updatedAt: new Date().toISOString()
    }

    await writeListings(listings)
    return res.status(200).json({ ok: true, listing: listings[idx] })
  }

  if(req.method === 'POST'){
    const session = await getServerSession(req, res, authOptions)
    const email = String(session?.user?.email || '').trim().toLowerCase()
    if(!email) return res.status(401).json({ error: 'Unauthorized' })
    if(!isValidEmail(email)) return res.status(400).json({ error: 'Valid user email required' })

    const {
      listingType,
      title,
      description,
      neighborhood,
      city,
      price,
      currency,
      imageDataUrl,
      imageDataUrls
    } = req.body || {}

    const lt = String(listingType || '').trim().toLowerCase()
    if(lt !== 'buy' && lt !== 'sell') return res.status(400).json({ error: 'listingType must be buy or sell' })

    const safeTitle = String(title || '').trim()
    const safeDescription = String(description || '').trim()
    const safeNeighborhood = String(neighborhood || '').trim()
    const safeCity = String(city || '').trim() || 'Cape Town'
    const currencyCode = normalizeCurrencyCode(currency)
    const inputPrice = Number(price)
    const zarPrice = convertToZar(inputPrice, currencyCode)

    if(!safeTitle) return res.status(400).json({ error: 'Title required' })
    if(safeTitle.length > 60) return res.status(400).json({ error: 'Title must be 60 characters or less' })
    if(!safeDescription) return res.status(400).json({ error: 'Description required' })
    if(safeDescription.length > 250) return res.status(400).json({ error: 'Description must be 250 characters or less' })
    if(!safeNeighborhood) return res.status(400).json({ error: 'Neighborhood required' })
    if(!ALLOWED_NEIGHBORHOODS.includes(safeNeighborhood)) return res.status(400).json({ error: 'Neighborhood must be selected from the list' })
    if(!Number.isFinite(inputPrice) || inputPrice <= 0) return res.status(400).json({ error: 'Valid price required' })
    if(!Number.isFinite(zarPrice) || zarPrice <= 0) return res.status(400).json({ error: 'Valid price required' })

    const hasImages = Object.prototype.hasOwnProperty.call((req.body || {}), 'imageDataUrls')
    const imagesError = hasImages ? validateImageDataUrls(imageDataUrls) : validateImageDataUrl(imageDataUrl)
    if(imagesError) return res.status(400).json({ error: imagesError })

    const normalizedImages = hasImages
      ? normalizeImageDataUrls(imageDataUrls)
      : (imageDataUrl ? [String(imageDataUrl)] : [])
    const primaryImage = normalizedImages[0] || null

    const listings = await readListings()

    const id = `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`
    const item = {
      id,
      listingType: lt,
      title: safeTitle,
      description: safeDescription,
      neighborhood: safeNeighborhood,
      city: safeCity,
      price: zarPrice,
      priceInput: inputPrice,
      currency: currencyCode,
      imageDataUrls: normalizedImages,
      imageDataUrl: primaryImage,
      ownerEmail: email,
      createdAt: new Date().toISOString()
    }

    listings.push(item)
    await writeListings(listings)

    return res.status(200).json({ ok: true, listing: item })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
