import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar(){
  const { data: session } = useSession()
  const email = session?.user?.email || ''
  const isAdmin = email === 'admin@local.test'
  const [preferredTool, setPreferredTool] = useState('')
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Prefer session role; fallback to localStorage
    const sessionRole = String(session?.user?.role || '').toLowerCase()
    if(sessionRole){
      setPreferredTool(sessionRole)
      return
    }
    try{
      const saved = localStorage.getItem('preferredTool')
      setPreferredTool(saved || 'buyer')
    }catch{
      setPreferredTool('buyer')
    }
  }, [session?.user?.role])

  useEffect(() => {
    // Load cart count for authenticated users
    if(session?.user?.email){
      loadCartCount()
    }
  }, [session?.user?.email])

  const loadCartCount = async () => {
    try{
      const res = await fetch('/api/cart/get')
      if(res.ok){
        const data = await res.json()
        setCartCount(data.count || 0)
      }
    }catch(e){
      console.error('Failed to load cart count:', e)
    }
  }

  const role = String(preferredTool || '').toLowerCase()
  const isBuyer = role === 'buyer'
  return (
    <header className="nav">
      <div className="nav-inner container" style={{ justifyContent: 'center' }}>
        <nav className="nav-links">
          <Link href="/about">About Us</Link>
          <Link href="/market">Market</Link>
          {session && (
            <>
              <Link href="/settings">Profile Settings</Link>
              <Link href="/cart" style={{position:'relative'}}>
                <button className="btn btn-ghost" style={{display:'flex',alignItems:'center',gap:6}}>
                  🛒 Cart
                  {cartCount > 0 && (
                    <span style={{
                      background:'linear-gradient(135deg, #ff00ff 0%, #a020f0 50%, #2d0052 100%)',
                      color:'white',
                      borderRadius:'999px',
                      padding:'2px 8px',
                      fontSize:12,
                      fontWeight:700,
                      minWidth:20,
                      textAlign:'center'
                    }}>
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>
            </>
          )}
          {session?
            <>
              <span className="nav-user" style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
                <span style={{fontWeight:700}}>{isAdmin ? 'Admin' : 'Buyer'}</span>
                <span className="small" style={{opacity:.85}}>{session.user?.name || session.user?.email}</span>
              </span>
              <button className="btn btn-ghost" onClick={()=>signOut()}>Sign out</button>
            </>
            : <Link href="/login"><button className="btn btn-ghost">Sign in</button></Link>
          }
        </nav>
      </div>
    </header>
  )
}
