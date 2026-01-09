import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { generateFairOffer } from '../lib/userSettings'

export default function PurchaseOffer() {
  const router = useRouter()
  const { propertyId } = router.query
  const { data: session } = useSession() ?? {}

  const [listing, setListing] = useState(null)
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offering, setOffering] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [offerPrice, setOfferPrice] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch property and claim details
  useEffect(() => {
    if (!propertyId) return

    const loadProperty = async () => {
      try {
        // Load property
        const listings = await fetch('/api/market/listings')
          .then(r => r.json())
          .then(d => d.listings || [])
          .catch(() => [])

        const property = listings.find(p => String(p.id) === String(propertyId))
        if (!property) {
          // Try static properties
          const staticProps = await import('../data/properties')
          const found = staticProps.default.find(p => String(p.id) === String(propertyId))
          setListing(found || null)
        } else {
          setListing(property)
        }

        // Load claim
        const claimRes = await fetch(`/api/claims/status?propertyId=${propertyId}`)
          .then(r => r.json())
          .catch(() => ({}))
        setClaim(claimRes?.claim || null)

        // Set default offer price
        if (property) {
          const fairOffer = generateFairOffer(property.price)
          setOfferPrice(fairOffer.toString())
        }
      } catch (e) {
        setError('Failed to load property')
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [propertyId])

  const handleSubmitOffer = async () => {
    if (!listing || !session?.user?.email) return

    setError(null)
    setSuccess(false)
    const offerNum = Number(offerPrice)

    if (!offerNum || offerNum <= 0) {
      setError('Please enter a valid offer price')
      return
    }

    setOffering(true)
    try {
      const res = await fetch('/api/user/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: listing.id,
          listingPrice: listing.price,
          offeredPrice: offerNum,
          agentEmail: claim?.agentEmail || 'admin@local.test',
          notes
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit offer')

      // Track engagement event
      await fetch('/api/engagement/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'inquiry_sent',
          propertyId: listing.id,
          metadata: { title: listing.title, offerPrice: offerNum }
        })
      }).catch(() => {})

      setSuccess(true)
      setOfferPrice('')
      setNotes('')
      setTimeout(() => router.push('/market'), 2000)
    } catch (e) {
      setError(e.message || 'Failed to submit offer')
    } finally {
      setOffering(false)
    }
  }

  if (!session) {
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Sign in required</h3>
            <a href="/login" className="btn btn-primary">Sign In to Make Offer</a>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Loading property…</h3>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Property not found</h3>
            <a href="/market" className="btn btn-outline">Back to Market</a>
          </div>
        </div>
      </div>
    )
  }

  const agentName = claim?.profile?.displayName || claim?.agentEmail || 'Agent'
  const fairOfferMin = Math.round(listing.price * 0.5)
  const fairOfferMax = Math.round(listing.price * 1.15)
  const offerNum = Number(offerPrice)

  return (
    <div>
      <Navbar />
      <main className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Property Info */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Property Details</h3>

            {listing?.imageDataUrl && (
              <img
                src={listing.imageDataUrl}
                alt={listing.title}
                style={{
                  width: '100%',
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 8,
                  marginBottom: 16
                }}
              />
            )}

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 20 }}>{listing.title}</div>
              <div style={{ color: '#666', marginTop: 4 }}>
                {listing.neighborhood} • {listing.city}
              </div>
            </div>

            <div style={{
              background: '#f3f4f6',
              padding: 12,
              borderRadius: 6,
              marginBottom: 16
            }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Asking Price</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                R{listing.price.toLocaleString()}
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              {listing.description}
            </div>

            {claim && (
              <div style={{
                background: 'rgba(79, 70, 229, 0.08)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                borderRadius: 6,
                padding: 12
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Agent</div>
                <div style={{ fontSize: 14 }}>{agentName}</div>
              </div>
            )}
          </div>

          {/* Offer Form */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Make Fair Price Offer</h3>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#dc2626',
                padding: 12,
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 13
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#16a34a',
                padding: 12,
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 13
              }}>
                ✓ Offer submitted! Redirecting…
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                Your Offer Price
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>R</span>
                <input
                  type="number"
                  className="input"
                  placeholder="Enter offer price"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  min={fairOfferMin}
                  max={fairOfferMax}
                />
              </div>

              <div style={{
                marginTop: 8,
                fontSize: 12,
                color: '#666',
                padding: 8,
                background: '#f3f4f6',
                borderRadius: 4
              }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>Fair Price Range:</strong> R{fairOfferMin.toLocaleString()} - R{fairOfferMax.toLocaleString()}
                </div>
                <div>
                  (50% to 115% of asking price)
                </div>
              </div>

              {offerNum > 0 && (
                <div style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: '#666'
                }}>
                  {offerNum < listing.price && (
                    <div>
                      <span style={{ color: '#dc2626' }}>⚠</span> {Math.round(((listing.price - offerNum) / listing.price) * 100)}% below asking price
                    </div>
                  )}
                  {offerNum >= listing.price && (
                    <div>
                      <span style={{ color: '#16a34a' }}>✓</span> {Math.round(((offerNum - listing.price) / listing.price) * 100)}% above asking price
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                Message to Agent (optional)
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Add any notes or questions about the property…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{
              background: 'rgba(251, 146, 60, 0.08)',
              border: '1px solid rgba(251, 146, 60, 0.2)',
              borderRadius: 6,
              padding: 12,
              marginBottom: 16,
              fontSize: 12
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>💡 Fair Pricing Protection</div>
              <div>
                This marketplace maintains fair pricing standards. Offers are limited to 50-115% 
                of the asking price to protect both buyers and sellers.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmitOffer}
                disabled={offering || !offerPrice}
                style={{ flex: 1 }}
              >
                {offering ? 'Submitting…' : 'Submit Offer'}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => router.back()}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
