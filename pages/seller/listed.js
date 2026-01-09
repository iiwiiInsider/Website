import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '../../components/Navbar'
import PropertyCard from '../../components/PropertyCard'

export default function SellerListed(){
  const { data: session, status } = useSession() ?? {}
  const [listings, setListings] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [filter, setFilter] = useState('all') // all | listed | sold
  const email = String(session?.user?.email || '').trim().toLowerCase()

  useEffect(() => {
    if(!email) return
    const load = async () => {
      try{
        const res = await fetch('/api/market/listings')
        const data = await res.json().catch(()=> ({}))
        const mine = (Array.isArray(data?.listings) ? data.listings : []).filter(l => String(l.ownerEmail || '').trim().toLowerCase() === email)
        setListings(mine)
        const ids = mine.map(l => l.id)
        if(ids.length){
          const sres = await fetch(`/api/market/status?ids=${encodeURIComponent(ids.join(','))}`)
          const sdata = await sres.json().catch(()=> ({}))
          if(sres.ok && sdata?.status) setStatusMap(sdata.status)
        }
      }catch{}
    }
    load()
  }, [email])

  const filtered = useMemo(() => {
    if(filter === 'all') return listings
    return listings.filter(l => (statusMap[String(l.id)] || 'listed') === filter)
  }, [filter, listings, statusMap])

  if(status === 'loading'){
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card"><h3>Loading…</h3></div>
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
            <h3>Seller area</h3>
            <div className="small" style={{opacity:0.8}}>Sign in as seller to view your listings.</div>
            <a href="/login" className="btn btn-primary">Sign In</a>
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
          <h2 style={{marginTop:0}}>My Listed Properties</h2>
          <div className="small" style={{opacity:0.8}}>Filter by status</div>
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button className={filter==='all'?'btn btn-primary':'btn btn-outline'} onClick={()=>setFilter('all')}>All</button>
            <button className={filter==='listed'?'btn btn-primary':'btn btn-outline'} onClick={()=>setFilter('listed')}>Listed</button>
            <button className={filter==='sold'?'btn btn-primary':'btn btn-outline'} onClick={()=>setFilter('sold')}>Sold</button>
          </div>
        </div>

        <div className="card">
          <div className="property-grid">
            {filtered.map(p => (
              <PropertyCard
                key={p.id}
                p={p}
                claim={null}
                canClaim={false}
                formatPrice={(zar)=>`R${zar.toLocaleString()}`}
                onEdit={undefined}
                onDelete={undefined}
              />
            ))}
          </div>
          {filtered.length === 0 && <div className="small" style={{marginTop:12}}>No listings found</div>}
        </div>
      </div>
    </div>
  )
}
