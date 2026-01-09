import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
// Neighborhood helpers unused after form simplification

export default function AdminProducts(){
  const { data: session, status } = useSession() ?? {}
  const isAdmin = String(session?.user?.email || '').trim().toLowerCase() === 'admin@local.test'
  
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [tab, setTab] = useState('view') // 'view' or 'create'
  
  // Form state for creating new listing (simplified: price + up to 5 images)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageDataUrl: null,
    imageGallery: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if(status === 'authenticated' && isAdmin){
      loadListings()
    }
  }, [status, isAdmin])

  const loadListings = async () => {
    try{
      const res = await fetch('/api/market/listings')
      const data = await res.json()
      setListings(Array.isArray(data.listings) ? data.listings : [])
    }catch(e){
      console.error('Failed to load listings:', e)
    }finally{
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5)
    if(files.length === 0) return

    Promise.all(files.map(file => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read image'))
      reader.readAsDataURL(file)
    }))).then(results => {
      const gallery = results.filter(Boolean).slice(0, 5)
      setFormData(prev => ({
        ...prev,
        imageGallery: gallery,
        imageDataUrl: gallery[0] || prev.imageDataUrl
      }))
    }).catch(() => {})
  }

  const handleCreateListing = async (e) => {
    e.preventDefault()
    
    if(!formData.title || !formData.price){
      setMessage('Title and price are required')
      return
    }

    setSubmitting(true)
    setMessage('')

    try{
      const res = await fetch('/api/admin/create-listing', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if(res.ok){
        setMessage('✓ Listing created successfully')
        setFormData({
          title: '',
          description: '',
          price: '',
          imageDataUrl: null,
          imageGallery: []
        })
        loadListings()
        setTimeout(() => setTab('view'), 2000)
      }else{
        setMessage('✗ ' + (data.error || 'Failed to create listing'))
      }
    }catch(e){
      setMessage('✗ Error: ' + (e.message || 'Failed to create listing'))
    }finally{
      setSubmitting(false)
    }
  }

  const deleteListing = async (listingId) => {
    if(!confirm('Delete this listing? This cannot be undone.')) return

    try{
      const res = await fetch('/api/admin/listings', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ listingId })
      })

      if(res.ok){
        setMessage('✓ Listing deleted')
        loadListings()
      }else{
        setMessage('✗ Failed to delete listing')
      }
    }catch(e){
      setMessage('✗ Error deleting listing')
    }
  }

  if(status === 'loading' || loading){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card"><h3>Loading…</h3></div>
        </div>
      </div>
    )
  }

  if(status === 'unauthenticated' || !isAdmin){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card">
            <h3>Admin Only</h3>
            <p>You must be signed in as admin to view this page.</p>
            <Link href="/admin-login"><button>Admin Login</button></Link>
          </div>
        </div>
      </div>
    )
  }

  const filteredListings = listings.filter(l => 
    !filter || 
    l.title?.toLowerCase().includes(filter.toLowerCase()) ||
    l.description?.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <Navbar />
      <div className="container" style={{marginTop:24, display:'grid', gap:16}}>
        <div className="card" style={{
          background:'linear-gradient(135deg, #120422 0%, #241040 45%, #3a1a66 100%)',
          color:'#e5e7ff',
          padding:'22px',
          border:'1px solid rgba(255,255,255,0.08)',
          boxShadow:'0 16px 40px rgba(10, 0, 25, 0.45)',
          backdropFilter:'blur(4px)'
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <h2 style={{margin:0}}>Products & Listings Management</h2>
            <Link href="/admin" style={{ textDecoration:'none' }}>
              <div style={{
                display:'inline-flex',
                alignItems:'center',
                gap:6,
                padding:'8px 10px',
                borderRadius:12,
                border:'1px solid rgba(229, 231, 235, 0.35)',
                color:'#e5e7ff',
                background:'rgba(255,255,255,0.04)',
                cursor:'pointer',
                transition:'all 0.15s ease'
              }}
              onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.borderColor='rgba(229, 231, 235, 0.55)'}}
              onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='rgba(229, 231, 235, 0.35)'}}>
                <span style={{fontSize:16}}>←</span>
                <span>Back to Dashboard</span>
              </div>
            </Link>
          </div>


          {message && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              borderRadius: '4px',
              backgroundColor: message.includes('✓') ? '#d4edda' : '#f8d7da',
              color: message.includes('✓') ? '#155724' : '#721c24',
              border: '1px solid ' + (message.includes('✓') ? '#c3e6cb' : '#f5c6cb')
            }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
            <button
              onClick={() => setTab('view')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: tab === 'view' ? '3px solid #007bff' : 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                color: tab === 'view' ? '#007bff' : '#999',
                fontWeight: tab === 'view' ? 'bold' : 'normal'
              }}>
              View All Listings
            </button>
            <button
              onClick={() => setTab('create')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: tab === 'create' ? '3px solid #007bff' : 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                color: tab === 'create' ? '#007bff' : '#999',
                fontWeight: tab === 'create' ? 'bold' : 'normal'
              }}>
              Create New Listing
            </button>
          </div>

          {tab === 'view' && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Filter listings..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gap: '15px' }}>
                {filteredListings.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                    No listings found
                  </p>
                ) : (
                  filteredListings.map(listing => (
                    <div key={listing.id} style={{
                      padding: '15px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr auto',
                      gap: '15px',
                      alignItems: 'start'
                    }}>
                      {listing.imageDataUrl && (
                        <img
                          src={listing.imageDataUrl}
                          alt={listing.title}
                          style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '4px',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      
                      <div>
                        <h4 style={{ margin: '0 0 5px 0' }}>{listing.title}</h4>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                          {listing.description?.substring(0, 100)}...
                        </p>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                          <strong>{listing.neighborhood}</strong> • {listing.city}
                        </p>
                        <p style={{ margin: '0', color: '#007bff', fontSize: '16px', fontWeight: 'bold' }}>
                          R {Number(listing.price || 0).toLocaleString()}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                          Type: {listing.listingType} • ID: {listing.id}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          onClick={() => deleteListing(listing.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {tab === 'create' && (
            <form onSubmit={handleCreateListing} style={{ maxWidth: '720px' }}>

              <div style={{ marginBottom: '15px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color:'#e5e7ff' }}>
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Listing title"
                  className="form-control"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', color:'#e5e7ff' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color:'#e5e7ff' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Short description"
                  rows="4"
                  className="form-control"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', color:'#e5e7ff', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color:'#e5e7ff' }}>
                  Price (ZAR) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="0"
                  min="0"
                  className="form-control"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', color:'#e5e7ff' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color:'#e5e7ff' }}>
                  Images (up to 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="form-control"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', color:'#e5e7ff' }}
                />
                {formData.imageGallery?.length ? (
                  <div style={{marginTop:10, display:'grid', gap:8}}>
                    <div style={{color:'#cbd5ff', fontSize:12}}>Preview (scrollable)</div>
                    <div style={{display:'grid', gridAutoFlow:'column', gridAutoColumns:'110px', gap:10, overflowX:'auto', paddingBottom:6}}>
                      {formData.imageGallery.map((img, idx) => (
                        <img key={idx} src={img} alt={`Preview ${idx+1}`} style={{width:'100%', height:90, objectFit:'cover', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)'}} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  background:'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  opacity: submitting ? 0.7 : 1,
                  boxShadow:'0 10px 24px rgba(124,58,237,0.35)'
                }}>
                {submitting ? 'Creating...' : 'Create Listing'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
