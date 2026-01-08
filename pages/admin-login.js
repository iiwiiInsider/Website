import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { signIn, useSession } from 'next-auth/react'
import Navbar from '../components/Navbar'

export default function AdminLogin(){
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [pingStatus, setPingStatus] = useState(null)

  // Check if running on localhost and perform ping
  useEffect(() => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    const localhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
    setIsLocalhost(localhost)
    
    if(localhost){
      // Perform admin ping
      fetch('/api/admin/ping')
        .then(res => res.json())
        .then(data => {
          setPingStatus({
            success: true,
            message: data.message || 'Admin server online',
            timestamp: new Date().toISOString()
          })
        })
        .catch(() => {
          setPingStatus({
            success: false,
            message: 'Admin server unreachable',
            timestamp: new Date().toISOString()
          })
        })
    }
  }, [])

  // Redirect if already logged in as admin
  useEffect(() => {
    if(status === 'authenticated' && session?.user?.email === 'admin@local.test'){
      router.push('/admin')
    }
  }, [status, session, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    // Block access if not on localhost
    if(!isLocalhost){
      setError('Admin login is only available on localhost')
      return
    }
    
    // Verify admin email
    if(email.toLowerCase() !== 'admin@local.test'){
      setError('Admin access only')
      return
    }

    setLoading(true)
    
    const res = await signIn('credentials', {
      email,
      password,
      role: 'admin',
      redirect: false
    })
    
    setLoading(false)
    
    if(res && !res.error){
      router.push('/admin')
    }else{
      setError('Invalid admin credentials')
    }
  }

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

  // Block page if not on localhost
  if(!isLocalhost){
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div style={{maxWidth:420,width:'100%'}}>
            <div className="card">
              <div style={{fontSize:64,textAlign:'center'}}>🚫</div>
              <h2 style={{textAlign:'center',color:'#ff0000',marginTop:16}}>Access Denied</h2>
              <p style={{textAlign:'center',color:'var(--muted)',marginTop:12}}>
                Admin login is only accessible from localhost for security reasons.
              </p>
              <div style={{marginTop:20,textAlign:'center'}}>
                <a href="/" className="btn btn-ghost">Back to Home</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container center">
        <div style={{maxWidth:420,width:'100%'}}>
          <div className="card">
            <div className="logo" style={{width:96,height:96,margin:'0 auto',background:'linear-gradient(135deg, #ff0000 0%, #cc0000 50%, #660000 100%)'}}>
              <div style={{fontSize:24}}>🔐</div>
            </div>
            <h2 style={{textAlign:'center',color:'#ff0000',marginTop:16}}>Admin Login</h2>
            <div style={{textAlign:'center',fontSize:14,color:'var(--muted)',marginTop:8}}>
              Restricted access for administrators only • Localhost
            </div>

            {pingStatus && (
              <div style={{
                marginTop:16,
                padding:'12px 16px',
                background: pingStatus.success ? 'rgba(0,255,0,0.08)' : 'rgba(255,0,0,0.08)',
                border: `1px solid ${pingStatus.success ? 'rgba(0,255,0,0.2)' : 'rgba(255,0,0,0.2)'}`,
                borderRadius:8,
                display:'flex',
                alignItems:'center',
                gap:8
              }}>
                <span style={{fontSize:20}}>{pingStatus.success ? '✅' : '❌'}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14}}>{pingStatus.message}</div>
                  <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>
                    {new Date(pingStatus.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{marginTop:24}}>
              <label style={{display:'block',fontWeight:600,marginBottom:8}}>Admin Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="admin@local.test"
                autoComplete="email"
                required
              />

              <label style={{display:'block',fontWeight:600,margin:'16px 0 8px'}}>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
              />

              {error && (
                <div style={{
                  marginTop:12,
                  padding:'10px 12px',
                  background:'rgba(255,0,0,0.1)',
                  border:'1px solid rgba(255,0,0,0.3)',
                  borderRadius:8,
                  color:'#ff3b3b',
                  fontSize:14
                }}>
                  {error}
                </div>
              )}

              <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:20}}>
                <button className="btn btn-danger" type="submit" disabled={loading}>
                  {loading ? 'Authenticating…' : 'Admin Sign In'}
                </button>
                <a href="/" className="btn btn-ghost">Cancel</a>
              </div>
            </form>

            <div style={{
              marginTop:20,
              padding:12,
              background:'rgba(255,255,0,0.08)',
              border:'1px solid rgba(255,255,0,0.2)',
              borderRadius:8,
              fontSize:13,
              color:'var(--muted)',
              textAlign:'center'
            }}>
              ⚠️ This login is for system administrators only. Unauthorized access attempts are logged.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
