import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import properties from '../data/properties'
import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function Market(){
  const router = useRouter()
  const { data: session, status } = useSession() ?? {}
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState(properties)

  useEffect(() => {
    if(status === 'unauthenticated'){
      router.replace('/login?redirect=/market')
    }
  }, [status, router])

  const handleSearch = () => {
    const q = search.toLowerCase().trim()
    if(!q){
      setFiltered(properties)
      return
    }
    const results = properties.filter(p => {
      const title = String(p.title || '').toLowerCase()
      const desc = String(p.description || '').toLowerCase()
      const hood = String(p.neighborhood || '').toLowerCase()
      return title.includes(q) || desc.includes(q) || hood.includes(q)
    })
    setFiltered(results)
  }

  if(status === 'loading' || status === 'unauthenticated'){
    return (
      <div className="container" style={{padding:40,textAlign:'center'}}>
        <p className="landing-muted">Checking your access...</p>
      </div>
    )
  }

  return (
    <div>
      <Head>
        <title>Market Listings - BurnProjects Marketplace</title>
      </Head>
      <Navbar />

      <main className="container" style={{marginTop:32}}>
        <section>
          <h1 className="landing-h2">Market Listings</h1>
          <p className="landing-muted" style={{marginTop:8,marginBottom:24}}>
            Browse available items from trusted sellers.
          </p>

          <div style={{marginBottom:24}}>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <input
                type="text"
                className="input"
                placeholder="Search listings..."
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                onKeyPress={(e)=> e.key === 'Enter' && handleSearch()}
                style={{flex:1,minWidth:200}}
              />
              <button className="btn btn-primary" onClick={handleSearch}>Search</button>
              <button className="btn btn-white" onClick={()=>{setSearch(''); setFiltered(properties)}}>Clear</button>
            </div>
          </div>

          <div className="landing-grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))'}}>
            {filtered.length === 0 && (
              <p className="landing-muted">No listings found.</p>
            )}
            {filtered.map((listing, index) => {
              const priceZar = Number(listing.price || 0)
              return (
                <div key={listing.id} className="landing-post">
                  <div style={{padding:'8px 12px',background:'rgba(160,32,240,0.1)',color:'#a020f0',fontSize:'12px',fontWeight:'700',textAlign:'center'}}>
                    Object {index + 1}
                  </div>
                  {listing.imageDataUrl && (
                    <div className="landing-post-media">
                      <img src={listing.imageDataUrl} alt={listing.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    </div>
                  )}
                  <div className="landing-post-body">
                    <h3 className="landing-post-title">{listing.title}</h3>
                    <p className="landing-muted" style={{marginTop:8,fontSize:14}}>{listing.description}</p>
                    <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:4}}>
                      <div style={{fontSize:14}}>
                        <strong>Location:</strong> {listing.neighborhood}, {listing.city || 'Cape Town'}
                      </div>
                      <div style={{fontSize:18,fontWeight:700,color:'var(--primary)'}}>
                        R {priceZar.toLocaleString()}
                      </div>
                    </div>
                    <Link href={`/property/${listing.id}`}>
                      <button className="btn btn-primary" style={{marginTop:16,width:'100%'}}>View Details</button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <footer className="landing-footer" aria-label="Footer" style={{marginTop:64}}>
          <div className="landing-footer-inner">
            <div className="landing-footer-left">
              <div className="brand-mark">BurnProjects</div>
              <div className="landing-muted">© BurnProjects. All rights reserved</div>
            </div>
            <div className="landing-footer-links">
              <Link href="/">Home</Link>
              <Link href="/about">About Us</Link>
              <Link href="/market">Market</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
