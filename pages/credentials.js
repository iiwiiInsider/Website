import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { signIn } from 'next-auth/react'

export default function CredentialsLogin(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFACode, setTwoFACode] = useState('')
  const [step, setStep] = useState(1) // 1 = credentials, 2 = 2FA code
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

  const handleCredentials = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try{
      const res = await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if(res.ok && data.ok){
        setStep(2)
      }else{
        setError(data.error || 'Invalid email or password')
      }
    }catch{
      setError('Something went wrong. Please try again.')
    }finally{
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      twoFACode,
      role: selectedRole,
      redirect: false
    })
    setLoading(false)
    if(res && !res.error){
      try{
        localStorage.setItem('userRole', selectedRole)
        await fetch('/api/user/record-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            timestamp: new Date().toISOString(),
            role: selectedRole,
            verificationImage: null,
            userAgent: navigator.userAgent,
            ipAddress: 'client-side'
          })
        })
      }catch{}
      router.push('/market')
    }else{
      setError('Invalid or expired verification code')
    }
  }

  const handleResend = async () => {
    setError(null)
    setLoading(true)
    try{
      const res = await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if(!res.ok || !data.ok){
        setError(data.error || 'Failed to resend code')
      }
    }catch{
      setError('Failed to resend code')
    }finally{
      setLoading(false)
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
                <h2 style={{margin:'6px 0 4px',color:'#A020F0'}}>
                  {step === 1 ? 'Continue with email' : 'Enter verification code'}
                </h2>
                <p style={{margin:0,color:'#cbd5e1',fontSize:14}}>
                  {step === 1
                    ? 'Access your account, track orders, and manage settings.'
                    : `A 6-digit code was sent to ${email}`}
                </p>
              </div>
              <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,#A020F0,#4f46e5)',display:'grid',placeItems:'center',color:'#fff',fontWeight:800,fontSize:18}}>M</div>
            </div>

            {step === 1 ? (
              <form onSubmit={handleCredentials} style={{marginTop:16}}>
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
                    {loading ? 'Sending code…' : 'Continue'}
                  </button>
                  <a href="/login" className="btn btn-ghost">Back</a>
                </div>

                <div className="small" style={{marginTop:12,opacity:0.75,textAlign:'center'}}>
                  New here? <a href="/register" className="link">Register</a>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify} style={{marginTop:16}}>
                <label style={{display:'block',fontWeight:600,marginBottom:8}}>Verification code</label>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={twoFACode}
                  onChange={e=>setTwoFACode(e.target.value.replace(/\D/g,''))}
                  placeholder="6-digit code"
                  autoComplete="one-time-code"
                  required
                />

                {error && <div className="small" style={{color:'#b91c1c',marginTop:10}}>{error}</div>}

                <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:16}}>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Verifying…' : 'Sign in'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={()=>{ setStep(1); setTwoFACode(''); setError(null) }}>
                    Back
                  </button>
                </div>

                <div className="small" style={{marginTop:12,opacity:0.75,textAlign:'center'}}>
                  Didn&apos;t receive a code?{' '}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleResend}
                    style={{background:'none',border:'none',color:'#A020F0',cursor:'pointer',fontSize:'inherit',padding:0,textDecoration:'underline'}}
                  >
                    Resend
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
