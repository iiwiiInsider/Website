import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import properties from '../../data/properties'
import Navbar from '../../components/Navbar'
import Link from 'next/link'

export default function PropertyDetail(){
  const router = useRouter()
  const { id } = router.query
  const [listing, setListing] = useState(null)

  useEffect(() => {
    if(!id) return
    const found = properties.find(p => String(p.id) === String(id))
    setListing(found || null)
  }, [id])

  if(!listing){
    return (
      <div>
        <Head>
          <title>Property Not Found - BurnProjects Marketplace</title>
        </Head>
        <Navbar />
        <div className="container" style={{marginTop:32}}>
          <div className="card">
            <h3 style={{marginTop:0}}>Property not found</h3>
            <Link href="/market">
              <button className="btn btn-outline">Back to Market</button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const priceZar = Number(listing.price || 0)

  return (
    <div>
      <Head>
        <title>{listing.title} - BurnProjects Marketplace</title>
      </Head>
      <Navbar />

      <main className="container" style={{marginTop:32}}>
        <div style={{marginBottom:24}}>
          <Link href="/market">
            <button className="btn btn-ghost">← Back to Market</button>
          </Link>
        </div>

        <div className="card">
          {listing.imageDataUrl && (
            <div style={{marginBottom:24}}>
              <img 
                src={listing.imageDataUrl} 
                alt={listing.title} 
                style={{width:'100%',maxHeight:400,objectFit:'cover',borderRadius:8}}
              />
            </div>
          )}

          <h1 className="landing-h2" style={{marginTop:0}}>{listing.title}</h1>

          <div style={{marginTop:16,marginBottom:24}}>
            <div style={{fontSize:28,fontWeight:700,color:'var(--primary)'}}>
              R {priceZar.toLocaleString()}
            </div>
          </div>

          <div style={{marginBottom:24}}>
            <h3>Location</h3>
            <p className="landing-muted">
              {listing.neighborhood}, {listing.city || 'Cape Town'}
            </p>
          </div>

          <div style={{marginBottom:24}}>
            <h3>Description</h3>
            <p className="landing-muted" style={{lineHeight:1.6}}>
              {listing.description}
            </p>
          </div>

          {listing.bedrooms && (
            <div style={{marginBottom:24}}>
              <h3>Details</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:16}}>
                {listing.bedrooms && (
                  <div>
                    <div className="landing-muted" style={{fontSize:14}}>Bedrooms</div>
                    <div style={{fontSize:18,fontWeight:600}}>{listing.bedrooms}</div>
                  </div>
                )}
                {listing.bathrooms && (
                  <div>
                    <div className="landing-muted" style={{fontSize:14}}>Bathrooms</div>
                    <div style={{fontSize:18,fontWeight:600}}>{listing.bathrooms}</div>
                  </div>
                )}
                {listing.sqft && (
                  <div>
                    <div className="landing-muted" style={{fontSize:14}}>Square Feet</div>
                    <div style={{fontSize:18,fontWeight:600}}>{listing.sqft.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{marginTop:32,paddingTop:24,borderTop:'1px solid var(--border)'}}>
            <Link href="/market">
              <button className="btn btn-primary">Browse More Listings</button>
            </Link>
          </div>
        </div>

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
