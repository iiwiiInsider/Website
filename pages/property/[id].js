import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import properties from '../../data/properties'
import Navbar from '../../components/Navbar'
import { formatFromZar, normalizeCurrencyCode } from '../../lib/currency'

export default function PropertyDetail(){
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [claim, setClaim] = useState(null)
  const [loadingClaim, setLoadingClaim] = useState(false)
  const [listing, setListing] = useState(null)
  const [loadingListing, setLoadingListing] = useState(false)
  const [displayCurrency, setDisplayCurrency] = useState('ZAR')
  const staticListing = properties.find(p => String(p.id) === String(id))

  useEffect(()=>{
    try{
      const saved = localStorage.getItem('displayCurrency')
      if(saved) setDisplayCurrency(normalizeCurrencyCode(saved))
    }catch{
      // ignore
    }
  },[])

  useEffect(()=>{
    if(!id) return
    if(staticListing){
      setListing(staticListing)
      return
    }
    setLoadingListing(true)
    fetch('/api/market/listings')
      .then(r=>r.json())
      .then(d=>{
        const all = Array.isArray(d?.listings) ? d.listings : []
        const found = all.find(x => String(x.id) === String(id))
        setListing(found || null)
      })
      .catch(()=>setListing(null))
      .finally(()=>setLoadingListing(false))
  },[id, staticListing])

  useEffect(()=>{
    if(!id) return
    setLoadingClaim(true)
    fetch(`/api/claims/status?propertyId=${encodeURIComponent(String(id))}`)
      .then(r=>r.json())
      .then(d=>setClaim(d?.claim || null))
      .catch(()=>setClaim(null))
      .finally(()=>setLoadingClaim(false))
  },[id])

  if(!listing){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card">
            <h3 style={{marginTop:0}}>{loadingListing ? 'Loading…' : 'Property not found'}</h3>
            <button className="btn btn-outline" onClick={()=>router.push('/market')}>Back to Market</button>
          </div>
        </div>
      </div>
    )
  }

  const normalizePhone = (value) => {
    const digits = String(value || '').replace(/\D/g,'')
    if(!digits) return null
    if(digits.startsWith('27')) return { e164: `+${digits}`, wa: digits }
    if(digits.startsWith('0')) {
      const wa = `27${digits.slice(1)}`
      return { e164: `+${wa}`, wa }
    }
    return { e164: `+${digits}`, wa: digits }
  }

  const agentName = claim?.profile?.displayName || claim?.agentEmail || null
  const agentAgency = claim?.profile?.agency || null
  const agentPhone = claim?.profile?.phone || null
  const agentEmail = claim?.agentEmail || null

  const priceText = formatFromZar(listing.price, displayCurrency)

  const fallbackPhone = '0762956266'
  const phone = normalizePhone(agentPhone || fallbackPhone)
  const whatsappHref = phone ? `https://wa.me/${phone.wa}?text=${encodeURIComponent(`Hi! I'm interested in ${listing.title} (${priceText}) in ${listing.neighborhood}, ${listing.city}.`)}` : null
  const outlookTo = agentEmail || ''
  const outlookHref = outlookTo ? `mailto:${outlookTo}?subject=${encodeURIComponent(`Property inquiry: ${listing.title}`)}&body=${encodeURIComponent(`Hi,\n\nI'm interested in: ${listing.title}\nNeighborhood: ${listing.neighborhood}\nCity: ${listing.city}\nPrice: ${priceText}\n\nPlease contact me with more details.\n`)}` : null
  const callHref = phone ? `tel:${phone.e164}` : null

  async function handleClaim(){
    try{
        const res = await fetch('/api/claims/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: listing.id })
      })
      const data = await res.json().catch(()=> ({}))
      if(res.status === 401){
        router.push('/login')
        return
      }
      if(res.status === 400 && Array.isArray(data?.missingFields)){
        alert(`Please complete your Agent Profile (${data.missingFields.join(', ')}) to claim listings.`)
        router.push('/agent/tools')
        return
      }
      if(res.status === 409){
        // refresh status
        const s = await fetch(`/api/claims/status?propertyId=${encodeURIComponent(String(listing.id))}`).then(r=>r.json()).catch(()=> null)
        setClaim(s?.claim || null)
        return
      }
      if(!res.ok){
        alert(data?.error || 'Unable to claim listing')
        return
      }
      const s = await fetch(`/api/claims/status?propertyId=${encodeURIComponent(String(listing.id))}`).then(r=>r.json()).catch(()=> null)
      setClaim(s?.claim || null)
    }catch{
      alert('Unable to claim listing')
    }
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="card">
          {listing?.imageDataUrl ? (
            <div style={{marginBottom:14}}>
              <img src={listing.imageDataUrl} alt={listing.title || 'Listing'} style={{width:'100%',height:260,objectFit:'cover',borderRadius:10,display:'block'}} />
            </div>
          ) : null}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <h2 style={{marginTop:0,marginBottom:0}}>{listing.title}</h2>
            <div style={{fontWeight:800}}>{priceText}</div>
          </div>

          <div className="small" style={{marginTop:8}}>{listing.neighborhood} • {listing.city}</div>

          <div style={{marginTop:10}}>
            {loadingClaim ? (
              <div className="small" style={{opacity:0.7}}>Loading claim…</div>
            ) : claim ? (
              <div className="small" style={{opacity:0.85}}>Claimed by {agentName}{agentAgency ? ` • ${agentAgency}` : ''}</div>
            ) : (
              <div className="small" style={{opacity:0.7}}>Unclaimed</div>
            )}
          </div>

          <div style={{marginTop:14,color:'#374151'}}>{listing.description}</div>

          <div style={{display:'flex',gap:10,marginTop:18,flexWrap:'wrap'}}>
            <button className="btn btn-outline" onClick={()=>router.push('/market')}>Back</button>
            {!claim ? (
              session ? (
                <button className="btn btn-outline" onClick={handleClaim}>Claim Listing</button>
              ) : (
                <a className="btn btn-outline" href="/login">Agent Login to Claim</a>
              )
            ) : null}
            {claim && whatsappHref ? (
              <a className="btn btn-primary" href={whatsappHref} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center'}}>
                WhatsApp
              </a>
            ) : null}
            {claim && outlookHref ? (
              <a className="btn btn-outline" href={outlookHref} style={{display:'inline-flex',alignItems:'center'}}>
                Outlook
              </a>
            ) : null}
            {claim && callHref ? (
              <a className="btn btn-outline" href={callHref} style={{display:'inline-flex',alignItems:'center'}}>
                Call
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
