import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Navbar from '../../components/Navbar'
import { formatFromZar } from '../../lib/currency'
import { ALLOWED_NEIGHBORHOODS, normalizeNeighborhood } from '../../lib/neighborhoods'

export default function AdminTools(){
  const { data: session, status } = useSession() ?? {}
  const isAdmin = String(session?.user?.email || '').trim().toLowerCase() === 'admin@local.test'

  const [listings, setListings] = useState([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [listingsError, setListingsError] = useState(null)

  const [editingListing, setEditingListing] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [editImageKey, setEditImageKey] = useState(0)
  const [editForm, setEditForm] = useState({
    listingType: 'buy',
    title: '',
    description: '',
    neighborhood: ALLOWED_NEIGHBORHOODS[0],
    city: 'Cape Town',
    price: '',
    imageDataUrl: null
  })

  const editRef = useRef(null)

  const uploadedListings = useMemo(
    ()=> (Array.isArray(listings) ? listings : []).filter(x => String(x?.id || '').startsWith('u_')),
    [listings]
  )

  const loadListings = async ()=>{
    setListingsError(null)
    setListingsLoading(true)
    try{
      const res = await fetch('/api/market/listings')
      const data = await res.json().catch(()=>({}))
      if(!res.ok) throw new Error(data?.error || 'Failed to load listings')
      setListings(Array.isArray(data.listings) ? data.listings : [])
    }catch(e){
      setListingsError(e.message || 'Failed to load listings')
    }finally{
      setListingsLoading(false)
    }
  }

  useEffect(()=>{
    if(status === 'authenticated' && isAdmin){
      loadListings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[status, isAdmin])

  const startEdit = (listing)=>{
    if(!listing) return
    setEditError(null)
    setEditingListing(listing)
    setEditForm({
      listingType: String(listing.listingType || 'buy').toLowerCase() === 'sell' ? 'sell' : 'buy',
      title: String(listing.title || ''),
      description: String(listing.description || ''),
      neighborhood: normalizeNeighborhood(listing.neighborhood),
      city: String(listing.city || 'Cape Town') || 'Cape Town',
      price: String(Math.round(Number(listing.price || 0) || 0)),
      imageDataUrl: listing?.imageDataUrl ? String(listing.imageDataUrl) : null
    })
    setEditImageKey(k=>k+1)
    setTimeout(() => {
      try{ editRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }catch{}
    }, 50)
  }

  const saveEdit = async ()=>{
    if(!editingListing) return
    setEditError(null)

    const payload = {
      id: editingListing.id,
      listingType: editForm.listingType,
      title: String(editForm.title || '').trim(),
      description: String(editForm.description || '').trim(),
      neighborhood: String(editForm.neighborhood || '').trim(),
      city: String(editForm.city || '').trim() || 'Cape Town',
      price: Number(editForm.price),
      imageDataUrl: editForm.imageDataUrl
    }

    if(!payload.title || !payload.description || !payload.neighborhood || !payload.price){
      setEditError('Please fill in title, description, neighborhood and price')
      return
    }
    if(payload.title.length > 60){
      setEditError('Title must be 60 characters or less')
      return
    }
    if(payload.description.length > 250){
      setEditError('Description must be 250 characters or less')
      return
    }
    if(!ALLOWED_NEIGHBORHOODS.includes(payload.neighborhood)){
      setEditError('Neighborhood must be selected from the list')
      return
    }
    if(!Number.isFinite(payload.price) || payload.price <= 0){
      setEditError('Valid price required')
      return
    }

    setEditSaving(true)
    try{
      const res = await fetch('/api/market/listings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(()=>({}))
      if(!res.ok) throw new Error(data?.error || 'Failed to save listing')
      setEditingListing(null)
      await loadListings()
    }catch(e){
      setEditError(e.message || 'Failed to save listing')
    }finally{
      setEditSaving(false)
    }
  }

  const deleteListing = async (listing)=>{
    setListingsError(null)
    const id = listing?.id
    if(!id) return
    const ok = typeof window !== 'undefined' ? window.confirm(`Delete listing ${id}?`) : false
    if(!ok) return

    try{
      const res = await fetch(`/api/market/listings?id=${encodeURIComponent(String(id))}`, { method: 'DELETE' })
      const data = await res.json().catch(()=>({}))
      if(!res.ok) throw new Error(data?.error || 'Failed to delete listing')
      await loadListings()
      if(editingListing && String(editingListing.id) === String(id)) setEditingListing(null)
    }catch(e){
      setListingsError(e.message || 'Failed to delete listing')
    }
  }

  if(status === 'loading'){
    return (
      <div>
        <Navbar />
        <div className="container center"><div className="card">Loading…</div></div>
      </div>
    )
  }

  if(!session || !isAdmin){
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3 style={{marginTop:0}}>Admin only</h3>
            <div className="small">Sign in as <strong>admin@local.test</strong> to access Admin Tools.</div>
          </div>
        </div>
      </div>
    )
  }

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
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div>
              <div style={{fontSize:13,letterSpacing:1,opacity:0.8,textTransform:'uppercase'}}>Admin Settings</div>
              <h2 style={{margin:'6px 0 4px 0'}}>Admin Tools</h2>
              <div className="small" style={{opacity:0.9,color:'#cbd5ff'}}>Signed in as <strong>{session.user.email}</strong></div>
              <div className="small" style={{opacity:0.85,marginTop:6,color:'#cbd5ff'}}>Edit uploaded listings and perform maintenance.</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background:'linear-gradient(135deg, rgba(18,4,34,0.88) 0%, rgba(25,13,45,0.95) 100%)', border:'1px solid rgba(255,255,255,0.06)', color:'#e5e7ff' }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div>
              <h3 style={{marginTop:0,marginBottom:6}}>Market Listings (Uploaded)</h3>
              <div className="small" style={{opacity:0.85,color:'#cbd5ff'}}>Admin edit for user-uploaded market listings only.</div>
            </div>
            <button className="btn btn-outline" onClick={loadListings} disabled={listingsLoading}>{listingsLoading ? 'Refreshing…' : 'Refresh'}</button>
          </div>
          {listingsError ? <div className="small" style={{color:'#fca5a5',marginTop:10}}>{listingsError}</div> : null}

          <div style={{marginTop:12,display:'grid',gap:10}}>
            {uploadedListings.length === 0 ? <div className="small" style={{opacity:0.75,color:'#cbd5ff'}}>No uploaded listings found.</div> : null}
            {uploadedListings.map(l => (
              <div key={l.id} style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center',padding:'10px 12px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10, background:'rgba(255,255,255,0.02)'}}>
                <div>
                  <div style={{fontWeight:800,color:'#f8f9ff'}}>{l.title}</div>
                  <div className="small" style={{opacity:0.85,color:'#d1d5ff'}}>{l.listingType} • {l.neighborhood} • {l.city}</div>
                  <div className="small" style={{opacity:0.9,color:'#d1d5ff'}}>{formatFromZar(l.price, 'ZAR')}</div>
                </div>
                <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'flex-end'}}>
                  <button className="btn btn-outline" onClick={()=>startEdit(l)}>Edit</button>
                  <button className="btn btn-danger" onClick={()=>deleteListing(l)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editingListing ? (
          <div ref={editRef} className="card" style={{marginTop:16, background:'linear-gradient(135deg, rgba(18,4,34,0.92) 0%, rgba(30,16,52,0.95) 100%)', border:'1px solid rgba(255,255,255,0.06)', color:'#e5e7ff'}}>
            <h3 style={{marginTop:0}}>Edit Listing</h3>
            <div className="small" style={{opacity:0.85,marginBottom:10,color:'#cbd5ff'}}>Editing: <strong>{editingListing.id}</strong></div>
            {editError ? <div className="small" style={{color:'#fca5a5',marginBottom:10}}>{editError}</div> : null}

            <div style={{display:'grid',gap:8}}>
              <select className="input" value={editForm.listingType} onChange={e=>setEditForm(f=>({...f, listingType: e.target.value}))}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>

              <input className="input" placeholder="Title (max 60 characters)" value={editForm.title} maxLength={60} onChange={e=>setEditForm(f=>({...f, title: e.target.value.slice(0,60)}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />

              <textarea className="input" rows={3} placeholder="Description (max 250 characters)" value={editForm.description} maxLength={250} onChange={e=>setEditForm(f=>({...f, description: e.target.value.slice(0,250)}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />

              <div>
                <div className="small" style={{opacity:0.85,marginTop:10}}>Edit Image (optional, PNG/JPG/WEBP, max 1MB)</div>
                <input
                  key={editImageKey}
                  className="input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={e=>{
                    setEditError(null)
                    const file = e.target.files && e.target.files[0]
                    if(!file) return
                    if(!/^image\/(png|jpeg|webp)$/.test(file.type)){
                      setEditError('Image must be a PNG, JPG, or WEBP')
                      setEditImageKey(k=>k+1)
                      return
                    }
                    if(file.size > 1_000_000){
                      setEditError('Image must be 1MB or smaller')
                      setEditImageKey(k=>k+1)
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = () => {
                      setEditError(null)
                      setEditForm(f=>({...f, imageDataUrl: String(reader.result || '') || null}))
                    }
                    reader.onerror = () => {
                      setEditError('Failed to read image')
                      setEditImageKey(k=>k+1)
                    }
                    reader.readAsDataURL(file)
                  }}
                />
                {editForm.imageDataUrl ? (
                  <button className="btn btn-outline" type="button" style={{marginTop:10}} onClick={()=>{ setEditForm(f=>({...f, imageDataUrl: null })); setEditImageKey(k=>k+1) }}>
                    Remove Image
                  </button>
                ) : null}
              </div>

              <select className="input" value={editForm.neighborhood} onChange={e=>setEditForm(f=>({...f, neighborhood: e.target.value}))}>
                {ALLOWED_NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <input className="input" placeholder="City" value={editForm.city} onChange={e=>setEditForm(f=>({...f, city: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />

              <input className="input" placeholder="Price (ZAR)" inputMode="numeric" type="number" min="1" step="1" value={editForm.price} onChange={e=>setEditForm(f=>({...f, price: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />

              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <button className="btn btn-primary" disabled={editSaving} onClick={saveEdit}>{editSaving ? 'Saving…' : 'Save Changes'}</button>
                <button className="btn btn-outline" disabled={editSaving} onClick={()=>{ setEditingListing(null); setEditError(null) }}>Close</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
