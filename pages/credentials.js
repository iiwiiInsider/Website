import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { signIn } from 'next-auth/react'

export default function CredentialsLogin(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedRole, setSelectedRole] = useState('buyer')

  useEffect(() => {
    try{
      const saved = localStorage.getItem('preferredTool')
      if(saved){
        setSelectedRole(saved)
      }else{
        localStorage.setItem('preferredTool', 'buyer')
      }
    }catch{}
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    const res = await signIn('credentials', {
      email,
      password,
      role: selectedRole,
      redirect: false
    })
    setLoading(false)
    if(res && !res.error){
      try{
        localStorage.setItem('userRole', selectedRole)
        
        const sessionData = {
          email,
          timestamp: new Date().toISOString(),
          role: selectedRole,
          verificationImage: null,
          userAgent: navigator.userAgent,
          ipAddress: 'client-side'
        }
        
        await fetch('/api/user/record-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        })
      }catch{}
      router.push('/market')
    }else{
      setError('Invalid email or password')
    }
  }

  return (
    <div style={{
      minHeight:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      padding:'64px 16px',
      background:'radial-gradient(circle at 15% 20%, rgba(160,32,240,0.2), transparent 30%), radial-gradient(circle at 85% 10%, rgba(0,200,255,0.14), transparent 32%), #0b1220'
    }}>
      <div className="container" style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
        <div style={{maxWidth:460,width:'100%'}}>
          <div style={{background:'rgba(12,18,32,0.9)',border:'1px solid #1f2a44',borderRadius:16,padding:24,boxShadow:'0 20px 50px rgba(0,0,0,0.45)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
              <div>
                <div style={{fontSize:13,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em'}}>Secure sign-in</div>
                <h2 style={{margin:'6px 0 4px',color:'#A020F0'}}>Continue with email</h2>
                <p style={{margin:0,color:'#cbd5e1',fontSize:14}}>Access your account, track orders, and manage settings.</p>
              </div>
              <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,#A020F0,#4f46e5)',display:'grid',placeItems:'center',color:'#fff',fontWeight:800,fontSize:18}}>M</div>
            </div>

            <form onSubmit={handleSubmit} style={{marginTop:16}}>
              <label style={{display:'block',fontWeight:600,marginBottom:8}}>Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <label style={{display:'block',fontWeight:600,margin:'12px 0 8px'}}>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />

              {error && <div className="small" style={{color:'#b91c1c',marginTop:10}}>{error}</div>}

              <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:16}}>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Signing in…' : 'Continue'}
                </button>
                <a href="/login" className="btn btn-ghost">Back</a>
              </div>

              <div className="small" style={{marginTop:12,opacity:0.75,textAlign:'center'}}>
                New here? <a href="/register" className="link">Register</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
