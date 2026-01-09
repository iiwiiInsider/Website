import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '../../components/Navbar'
import Link from 'next/link'

export default function AdminListings(){
  const { data: session, status } = useSession() ?? {}
  const [listings, setListings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [editingListing, setEditingListing] = useState(null)

  useEffect(() => {
    if(status === 'authenticated' && session?.user?.email === 'admin@local.test'){
      loadData()
    }
  }, [status, session])

  const loadData = async () => {
    try{
      const [listingsRes, usersRes] = await Promise.all([
        fetch('/api/admin/listings'),
        fetch('/api/admin/users')
      ])
      
      if(listingsRes.ok){
        const data = await listingsRes.json()
        setListings(data.listings || [])
      }
      
      if(usersRes.ok){
        const data = await usersRes.json()
        setUsers(data.users || [])
      }
    }catch(e){
      console.error('Failed to load data:', e)
    }finally{
      setLoading(false)
    }
  }

  const deleteListing = async (listingId) => {
    if(!confirm('Are you sure you want to delete this listing?')) return

    try{
      const res = await fetch('/api/admin/listings', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ listingId })
      })

      if(res.ok){
        loadData()
      }else{
        alert('Failed to delete listing')
      }
    }catch(e){
      alert('Failed to delete listing')
    }
  }

  const updateListing = async (listingId, updates) => {
    try{
      const res = await fetch('/api/admin/listings', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ listingId, updates })
      })

      if(res.ok){
        setEditingListing(null)
        loadData()
      }else{
        alert('Failed to update listing')
      }
    }catch(e){
      alert('Failed to update listing')
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

  if(status === 'unauthenticated' || session?.user?.email !== 'admin@local.test'){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card">
            <h3>Admin only</h3>
            <p>You must be signed in as admin to view this page.</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredListings = listings.filter(listing => 
    !filter || 
    listing.title?.toLowerCase().includes(filter.toLowerCase()) ||
    listing.location?.toLowerCase().includes(filter.toLowerCase()) ||
    listing.agentEmail?.toLowerCase().includes(filter.toLowerCase())
  )

  const getAgentEmail = (listingId) => {
    const listing = listings.find(l => l.id === listingId)
    return listing?.agentEmail || 'Unclaimed'
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
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <h2 style={{marginTop:0, marginBottom:0}}>Manage All Listings</h2>
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

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:16,marginTop:16}}>
            <div style={{padding:16,background:'rgba(160,32,240,0.08)',borderRadius:8,border:'1px solid rgba(160,32,240,0.2)'}}>
              <div style={{fontSize:14,color:'var(--muted)'}}>Total Listings</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>{listings.length}</div>
            </div>
            <div style={{padding:16,background:'rgba(0,255,255,0.08)',borderRadius:8,border:'1px solid rgba(0,255,255,0.2)'}}>
              <div style={{fontSize:14,color:'var(--muted)'}}>Claimed</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>
                {listings.filter(l => l.agentEmail).length}
              </div>
            </div>
            <div style={{padding:16,background:'rgba(255,255,0,0.08)',borderRadius:8,border:'1px solid rgba(255,255,0,0.2)'}}>
              <div style={{fontSize:14,color:'var(--muted)'}}>Unclaimed</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>
                {listings.filter(l => !l.agentEmail).length}
              </div>
            </div>
          </div>

          <div style={{marginTop:20}}>
            <input
              className="input"
              placeholder="Search listings by title, location, or agent..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{marginTop:0}}
            />
          </div>

          <div style={{marginTop:20,overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--border)'}}>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Title</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Location</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Price</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Agent</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Status</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr key={listing.id} style={{borderBottom:'1px solid var(--border-soft)'}}>
                    <td style={{padding:'10px 8px',fontSize:13,fontWeight:600}}>{listing.title}</td>
                    <td style={{padding:'10px 8px',fontSize:13}}>{listing.location || listing.neighborhood}</td>
                    <td style={{padding:'10px 8px',fontSize:13,fontWeight:700,color:'var(--accent-cyan)'}}>
                      R {listing.price?.toLocaleString()}
                    </td>
                    <td style={{padding:'10px 8px',fontSize:12}}>{listing.agentEmail || '-'}</td>
                    <td style={{padding:'10px 8px',fontSize:12}}>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:4,
                        background: listing.agentEmail ? 'rgba(0,255,0,0.1)' : 'rgba(255,255,0,0.1)',
                        border: `1px solid ${listing.agentEmail ? 'rgba(0,255,0,0.3)' : 'rgba(255,255,0,0.3)'}`,
                        fontSize:11,
                        fontWeight:600
                      }}>
                        {listing.agentEmail ? 'Claimed' : 'Unclaimed'}
                      </span>
                    </td>
                    <td style={{padding:'10px 8px'}}>
                      <div style={{display:'flex',gap:8}}>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => setEditingListing(listing)}
                          style={{fontSize:12,padding:'6px 12px'}}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => deleteListing(listing.id)}
                          style={{fontSize:12,padding:'6px 12px'}}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredListings.length === 0 && (
              <div style={{padding:32,textAlign:'center',color:'var(--muted)'}}>
                No listings found
              </div>
            )}
          </div>
        </div>

        {editingListing && (
          <div style={{
            position:'fixed',
            inset:0,
            background:'rgba(0,0,0,0.8)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            padding:20,
            zIndex:9999
          }}>
            <div className="card" style={{maxWidth:600,width:'100%',maxHeight:'90vh',overflowY:'auto'}}>
              <h3 style={{marginTop:0}}>Edit Listing</h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                const updates = {
                  title: formData.get('title'),
                  location: formData.get('location'),
                  price: parseFloat(formData.get('price')),
                  description: formData.get('description')
                }
                updateListing(editingListing.id, updates)
              }}>
                <label style={{display:'block',fontWeight:600,marginTop:12}}>Title</label>
                <input className="input" name="title" defaultValue={editingListing.title} required />

                <label style={{display:'block',fontWeight:600,marginTop:12}}>Location</label>
                <input className="input" name="location" defaultValue={editingListing.location || editingListing.neighborhood} required />

                <label style={{display:'block',fontWeight:600,marginTop:12}}>Price</label>
                <input className="input" name="price" type="number" defaultValue={editingListing.price} required />

                <label style={{display:'block',fontWeight:600,marginTop:12}}>Description</label>
                <textarea className="input" name="description" rows={4} defaultValue={editingListing.description} required />

                <div style={{display:'flex',gap:12,marginTop:20}}>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingListing(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
