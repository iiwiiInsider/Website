import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function Cart(){
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState([])

  useEffect(() => {
    if(status === 'authenticated'){
      loadCart()
      loadListings()
    } else if(status === 'unauthenticated'){
      setLoading(false)
    }
  }, [status])

  const loadCart = async () => {
    try{
      const res = await fetch('/api/cart/get')
      if(res.ok){
        const data = await res.json()
        setCartItems(data.items || [])
      }
    }catch(e){
      console.error('Failed to load cart:', e)
    }finally{
      setLoading(false)
    }
  }

  const loadListings = async () => {
    try{
      const res = await fetch('/api/listings')
      if(res.ok){
        const data = await res.json()
        setListings(data.listings || [])
      }
    }catch(e){
      console.error('Failed to load listings:', e)
    }
  }

  const removeFromCart = async (listingId) => {
    try{
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ listingId })
      })
      if(res.ok){
        loadCart()
      }
    }catch(e){
      console.error('Failed to remove from cart:', e)
    }
  }

  const clearCart = async () => {
    try{
      const res = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      })
      if(res.ok){
        loadCart()
      }
    }catch(e){
      console.error('Failed to clear cart:', e)
    }
  }

  if(status === 'loading' || loading){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card"><h3>Loading cart…</h3></div>
        </div>
      </div>
    )
  }

  if(status === 'unauthenticated'){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card">
            <h3>Sign in required</h3>
            <p>Please sign in to view your cart.</p>
            <div style={{marginTop:16}}>
              <Link href="/login"><button className="btn btn-primary">Sign In</button></Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const cartListings = cartItems.map(item => {
    const listing = listings.find(l => l.id === item.listingId)
    return listing ? {...listing, addedAt: item.addedAt} : null
  }).filter(Boolean)

  const totalPrice = cartListings.reduce((sum, listing) => sum + (listing.price || 0), 0)

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <h2 style={{marginTop:0}}>Shopping Cart</h2>
            {cartItems.length > 0 && (
              <button className="btn btn-outline" onClick={clearCart}>Clear Cart</button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div style={{padding:'40px 20px',textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:16}}>🛒</div>
              <h3 style={{color:'var(--muted)'}}>Your cart is empty</h3>
              <p className="landing-muted" style={{marginTop:8}}>
                Browse the market to add properties to your cart
              </p>
              <div style={{marginTop:20}}>
                <Link href="/market"><button className="btn btn-primary">Browse Market</button></Link>
              </div>
            </div>
          ) : (
            <>
              <div style={{marginTop:20}}>
                {cartListings.map(listing => (
                  <div key={listing.id} className="card" style={{marginTop:12,padding:16}}>
                    <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                      <div style={{flex:'0 0 120px',height:120,background:'rgba(160,32,240,0.08)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {listing.imageUrl ? (
                          <img src={listing.imageUrl} alt={listing.title} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}} />
                        ) : (
                          <div style={{fontSize:32}}>🏠</div>
                        )}
                      </div>
                      <div style={{flex:1,minWidth:200}}>
                        <h3 style={{marginTop:0}}>{listing.title}</h3>
                        <p className="small" style={{marginTop:4}}>{listing.location || 'Location not specified'}</p>
                        <p className="prop-desc" style={{marginTop:8}}>{listing.description || 'No description'}</p>
                      </div>
                      <div style={{flex:'0 0 auto',display:'flex',flexDirection:'column',gap:12,justifyContent:'space-between',alignItems:'flex-end'}}>
                        <div style={{fontSize:24,fontWeight:700,color:'var(--accent-cyan)'}}>
                          R {listing.price?.toLocaleString()}
                        </div>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => removeFromCart(listing.id)}
                          style={{fontSize:14,padding:'8px 16px'}}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{marginTop:20,background:'rgba(160,32,240,0.08)',border:'2px solid rgba(160,32,240,0.2)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:600}}>Total ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</div>
                    <div style={{fontSize:32,fontWeight:900,marginTop:4,color:'var(--accent-cyan)'}}>
                      R {totalPrice.toLocaleString()}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                    <Link href="/market"><button className="btn btn-outline">Continue Shopping</button></Link>
                    <button className="btn btn-primary" style={{fontSize:16,padding:'12px 24px'}}>
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
