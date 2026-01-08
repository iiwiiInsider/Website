import { useEffect, useState } from 'react'
import properties from '../data/properties'
import { useSession, signIn } from 'next-auth/react'
import Navbar from '../components/Navbar'
import { CURRENCIES, formatFromZar, normalizeCurrencyCode, convertToZar, currencyForTimeZone } from '../lib/currency'
import { ALLOWED_NEIGHBORHOODS, normalizeNeighborhood } from '../lib/neighborhoods'

export default function Market(){
  const { data: session, status } = useSession()
  const [preferredTool, setPreferredTool] = useState('')
  const [search, setSearch] = useState('')
  const [listingType, setListingType] = useState('sell')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filtered, setFiltered] = useState([])
  const [recentDevices, setRecentDevices] = useState(null)
  const [claims, setClaims] = useState({})
  const [userListings, setUserListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [displayCurrency, setDisplayCurrency] = useState('ZAR')
  const [displayTimeZone, setDisplayTimeZone] = useState('Africa/Johannesburg')

  const [editingListing, setEditingListing] = useState(null)
  const [editForm, setEditForm] = useState({
    listingType: 'buy',
    title: '',
    description: '',
    neighborhood: ALLOWED_NEIGHBORHOODS[0],
    city: 'Cape Town',
    price: '',
    imageDataUrl: null
  })
  const [editImageKey, setEditImageKey] = useState(0)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  const TIMEZONES = [
    { id: 'Africa/Johannesburg', label: 'South Africa (SAST)' },
    { id: 'America/New_York', label: 'US (New York)' },
    { id: 'Asia/Tokyo', label: 'Asia (Tokyo)' },
    { id: 'Australia/Sydney', label: 'Australia (Sydney)' },
    { id: 'America/Toronto', label: 'Canada (Toronto)' },
    { id: 'Europe/Berlin', label: 'Germany (Berlin)' },
    { id: 'Pacific/Auckland', label: 'New Zealand (Auckland)' },
    { id: 'Asia/Dubai', label: 'UAE (Dubai)' }
  ]

  const combinedListings = [...properties, ...userListings]
  useEffect(() => {
    const sessionRole = String(session?.user?.role || '').toLowerCase()
    if(sessionRole){
      setPreferredTool(sessionRole)
      return
    }
    try{
      const saved = localStorage.getItem('preferredTool')
      setPreferredTool(saved || '')
    }catch{}
  }, [session?.user?.role])


  const loadUserListings = async () => {
    setLoadingListings(true)
    try{
      const res = await fetch('/api/market/listings')
      const data = await res.json().catch(()=> ({}))
      if(res.ok) setUserListings(Array.isArray(data?.listings) ? data.listings : [])
    }catch{
      // ignore
    }finally{
      setLoadingListings(false)
    }
  }

  const deleteListing = async (id) => {
    const confirmed = typeof window !== 'undefined' ? window.confirm('Delete this listing?') : false
    if(!confirmed) return
    try{
      const res = await fetch(`/api/market/listings?id=${encodeURIComponent(String(id))}`, { method: 'DELETE' })
      const data = await res.json().catch(()=> ({}))
      if(!res.ok){
        alert(data?.error || 'Failed to delete listing')
        return
      }
      setUserListings(prev => prev.filter(l => String(l.id) !== String(id)))
      refreshClaims([id])
    }catch{
      alert('Failed to delete listing')
    }
  }

  const startEdit = (listing) => {
    if(!listing) return
    setEditError(null)
    setEditingListing(listing)
    setEditForm({
      listingType: String(listing.listingType || 'buy').toLowerCase() === 'sell' ? 'sell' : 'buy',
      title: String(listing.title || '').slice(0,60),
      description: String(listing.description || '').slice(0,250),
      neighborhood: normalizeNeighborhood(listing.neighborhood),
      city: String(listing.city || 'Cape Town') || 'Cape Town',
      price: String(Math.round(Number(listing.priceInput ?? listing.price ?? 0) || 0)),
      imageDataUrl: listing?.imageDataUrl ? String(listing.imageDataUrl) : null
    })
    setEditImageKey(k=>k+1)
  }

  const cancelEdit = () => {
    setEditError(null)
    setEditSaving(false)
    setEditingListing(null)
  }

  const saveEdit = async () => {
    if(!editingListing?.id) return
    setEditError(null)
    const payload = {
      id: editingListing.id,
      listingType: editForm.listingType,
      title: String(editForm.title || '').trim(),
      description: String(editForm.description || '').trim(),
      neighborhood: String(editForm.neighborhood || '').trim(),
      city: String(editForm.city || '').trim() || 'Cape Town',
      price: Number(editForm.price),
      currency: 'ZAR',
      imageDataUrl: editForm.imageDataUrl
    }

    if(!payload.title || !payload.description || !payload.neighborhood || !payload.price){
      setEditError('Please fill in title, description, neighborhood and price')
      return
    }

    setEditSaving(true)
    try{
      const res = await fetch('/api/market/listings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(()=> ({}))
      if(!res.ok) throw new Error(data?.error || 'Failed to save changes')
      const updated = data?.listing || null
      if(updated){
        setUserListings(prev => prev.map(l => String(l.id) === String(updated.id) ? updated : l))
      }
      refreshClaims([editingListing.id])
      cancelEdit()
    }catch(e){
      setEditError(e.message || 'Failed to save changes')
    }finally{
      setEditSaving(false)
    }
  }

  useEffect(()=>{
    let out = combinedListings
    if(listingType) out = out.filter(p => (p.listingType || '').toLowerCase() === listingType)
    if(search) out = out.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    if(minPrice) out = out.filter(p => p.price >= convertToZar(Number(minPrice), displayCurrency))
    if(maxPrice) out = out.filter(p => p.price <= convertToZar(Number(maxPrice), displayCurrency))
    setFiltered(out)
  },[listingType,search,minPrice,maxPrice,userListings,displayCurrency])

  const refreshClaims = async (ids) => {
    try{
      const idList = ids && ids.length ? ids : combinedListings.map(p=>p.id)
      const res = await fetch(`/api/claims/list?ids=${encodeURIComponent(idList.join(','))}`)
      const data = await res.json().catch(()=> ({}))
      if(res.ok && data?.claims) setClaims(data.claims)
    }catch{
      // ignore
    }
  }

  useEffect(()=>{
    refreshClaims()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(()=>{
    if(!session) return
    loadUserListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[session?.user?.email])

  useEffect(()=>{
    try{
      const saved = localStorage.getItem('displayCurrency')
      if(saved) setDisplayCurrency(normalizeCurrencyCode(saved))
    }catch{
      // ignore
    }
  },[])

  useEffect(()=>{
    try{
      const savedTz = localStorage.getItem('displayTimeZone')
      if(savedTz) setDisplayTimeZone(savedTz)
    }catch{
      // ignore
    }
  },[])

  useEffect(()=>{
    try{
      localStorage.setItem('displayCurrency', displayCurrency)
    }catch{
      // ignore
    }
  },[displayCurrency])

  useEffect(()=>{
    try{
      localStorage.setItem('displayTimeZone', displayTimeZone)
    }catch{
      // ignore
    }
  },[displayTimeZone])

  useEffect(()=>{
    // Keep currency and timezone aligned (timezone is the "source of truth").
    const nextCurrency = currencyForTimeZone(displayTimeZone)
    if(nextCurrency !== displayCurrency) setDisplayCurrency(nextCurrency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[displayTimeZone])

  const formatPrice = (zar) => formatFromZar(zar, displayCurrency)

  const formatTime = (iso) => {
    try{
      return new Date(iso).toLocaleString('en-ZA', { timeZone: displayTimeZone })
    }catch{
      return new Date(iso).toLocaleString('en-ZA')
    }
  }

  useEffect(()=>{
    if(!session?.user?.email) return
    fetch(`/api/tracking/recent?email=${encodeURIComponent(session.user.email)}`).then(r=>r.json()).then(d=>setRecentDevices(d)).catch(()=>setRecentDevices(null))
  },[session?.user?.email])

  if(status === 'loading'){
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Loading your session…</h3>
            <div className="small" style={{opacity:0.8}}>If this takes long, refresh once.</div>
          </div>
        </div>
      </div>
    )
  }

  if(!session){
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Please sign in to view the market</h3>
            <button onClick={()=>signIn()} className="btn btn-primary">Sign In</button>
          </div>
        </div>
      </div>
    )
  }

  

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="card">
          <div style={{marginBottom:12}}>
            <h2 style={{marginTop:0,marginBottom:6}}>Market</h2>
            <div className="small">Buy or sell Square Meters</div>
            <div className="market-prefs">
              <div className="market-pref-row">
                <div className="small" style={{opacity:0.85}}>Currency</div>
                <select className="input market-select" value={displayCurrency} onChange={e=>setDisplayCurrency(normalizeCurrencyCode(e.target.value))}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <div className="small" style={{opacity:0.7}}>Converted from ZAR (approx)</div>
              </div>
              <div className="market-pref-row">
                <div className="small" style={{opacity:0.85}}>Timezone</div>
                <select className="input market-select" value={displayTimeZone} onChange={e=>setDisplayTimeZone(e.target.value)}>
                  {TIMEZONES.map(tz => <option key={tz.id} value={tz.id}>{tz.label}</option>)}
                </select>
                <div className="small" style={{opacity:0.7}}>Default is South Africa</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{marginBottom:12}}>
            <input className="input" placeholder="Search any available market" value={search} onChange={e=>setSearch(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
            <div className="filter-row" style={{marginTop:10}}>
              <input className="input filter" placeholder={`Min (${displayCurrency})`} value={minPrice} onChange={e=>setMinPrice(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
              <input className="input filter" placeholder={`Max (${displayCurrency})`} value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
            </div>
          </div>

          {recentDevices && recentDevices.length > 0 && (
            <div className="small" style={{marginBottom:12}}>
              <strong>Recent devices used to access your account:</strong>
              <div style={{marginTop:8}}>
                {recentDevices.slice(0,3).map((d,i)=> (
                  <div key={i} style={{marginBottom:6}}>
                    <div style={{fontWeight:600}}>{d.platform || d.userAgent?.slice(0,60) || 'Device'}</div>
                    <div className="small">{formatTime(d.time)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editingListing ? (
            <div className="card" style={{marginTop:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                <div>
                  <div style={{fontWeight:800}}>Edit Listing</div>
                  <div className="small" style={{opacity:0.8}}>You can update or remove anything you added.</div>
                </div>
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  <button className="btn btn-outline" onClick={cancelEdit} disabled={editSaving}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveEdit} disabled={editSaving}>{editSaving ? 'Saving…' : 'Save'}</button>
                </div>
              </div>

              {editError ? <div className="small" style={{color:'#b91c1c',marginTop:10}}>{editError}</div> : null}

              <div style={{marginTop:12,display:'grid',gap:8}}>
                <select className="input" value={editForm.listingType} onChange={e=>setEditForm(f=>({...f, listingType: e.target.value}))}>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>

                <input className="input" placeholder="Title (max 60 characters)" value={editForm.title} maxLength={60} onChange={e=>setEditForm(f=>({...f, title: e.target.value.slice(0,60)}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
                <textarea className="input" rows={3} placeholder="Description (max 250 characters)" value={editForm.description} maxLength={250} onChange={e=>setEditForm(f=>({...f, description: e.target.value.slice(0,250)}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />

                <div>
                  <div className="small" style={{opacity:0.85,marginTop:10}}>Update Image (optional, PNG/JPG/WEBP, max 1MB)</div>
                  <input
                    key={editImageKey}
                    className="input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={e=>{
                      setEditError(null)
                      const file = e.target.files && e.target.files[0]
                      if(!file){
                        // keep existing image unless user explicitly removes it
                        return
                      }
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
                  <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}>
                    <button
                      className="btn btn-outline"
                      disabled={editSaving}
                      onClick={()=>{
                        setEditError(null)
                        setEditForm(f=>({...f, imageDataUrl: null}))
                        setEditImageKey(k=>k+1)
                      }}
                    >Remove Image</button>
                  </div>
                </div>

                <select className="input" value={editForm.neighborhood} onChange={e=>setEditForm(f=>({...f, neighborhood: e.target.value}))}>
                  {ALLOWED_NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>

                <input className="input" placeholder="City" value={editForm.city} onChange={e=>setEditForm(f=>({...f, city: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
                <input className="input" placeholder="Price (ZAR)" inputMode="numeric" type="number" min="1" step="1" value={editForm.price} onChange={e=>setEditForm(f=>({...f, price: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
              </div>
            </div>
          ) : null}

          {/* Listings removed per request */}
        </div>
      </div>
    </div>
  )
}
