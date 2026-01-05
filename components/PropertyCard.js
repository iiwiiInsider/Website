import { useRouter } from 'next/router'

export default function PropertyCard({ p, claim, canClaim, onClaimed, formatPrice, onEdit, onDelete }){
  const router = useRouter()

  const priceText = typeof formatPrice === 'function' ? formatPrice(p.price) : `R${p.price.toLocaleString()}`

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

  const fallbackPhone = '0762956266'
  const contactPhone = normalizePhone(agentPhone || fallbackPhone)
  const whatsappHref = contactPhone ? `https://wa.me/${contactPhone.wa}?text=${encodeURIComponent(`Hi! I'm interested in ${p.title} (${priceText}) in ${p.neighborhood}, ${p.city}.`)}` : null
  const outlookTo = agentEmail || ''
  const outlookHref = outlookTo ? `mailto:${outlookTo}?subject=${encodeURIComponent(`Property inquiry: ${p.title}`)}&body=${encodeURIComponent(`Hi,\n\nI'm interested in: ${p.title}\nNeighborhood: ${p.neighborhood}\nCity: ${p.city}\nPrice: ${priceText}\n\nPlease contact me with more details.\n`)}` : null
  const callHref = contactPhone ? `tel:${contactPhone.e164}` : null

  async function handleClaim(){
    try{
      const res = await fetch('/api/claims/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: p.id })
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
        alert('This listing was already claimed.')
        if(typeof onClaimed === 'function') onClaimed()
        return
      }
      if(!res.ok){
        alert(data?.error || 'Unable to claim listing')
        return
      }

      if(typeof onClaimed === 'function') onClaimed()
    }catch{
      alert('Unable to claim listing')
    }
  }

  return (
    <article className="property-card">
      <div className="prop-media">
        {p?.imageDataUrl ? (
          <img className="prop-img" src={p.imageDataUrl} alt={p.title || 'Listing'} loading="lazy" />
        ) : (
          <div className="prop-placeholder">{p.title.split(' ')[0]}</div>
        )}
        <div className="price-badge">{priceText}</div>
      </div>
      <div className="prop-body">
        <div className="prop-title">{p.title}</div>
        <div className="small prop-sub">{p.neighborhood} • {p.city}</div>
        <div className="prop-desc">{p.description}</div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:12,gap:10,alignItems:'flex-start'}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <button className="btn btn-outline" onClick={()=>router.push(`/property/${p.id}`)}>View</button>
            {!claim ? (
              canClaim ? (
                <button className="btn btn-outline" onClick={handleClaim}>Claim Listing</button>
              ) : (
                <a className="btn btn-outline" href="/login">Agent Login to Claim</a>
              )
            ) : null}
          </div>

          <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
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
            {typeof onEdit === 'function' && (
              <button className="btn btn-outline" onClick={onEdit}>Edit</button>
            )}
            {typeof onDelete === 'function' && (
              <button className="btn btn-danger" onClick={onDelete}>Delete</button>
            )}
          </div>
        </div>

        <div style={{marginTop:10}}>
          {claim ? (
            <div className="small" style={{opacity:0.85}}>
              Claimed by {agentName}{agentAgency ? ` • ${agentAgency}` : ''}
            </div>
          ) : (
            <div className="small" style={{opacity:0.7}}>Unclaimed</div>
          )}
        </div>
      </div>
    </article>
  )
}
