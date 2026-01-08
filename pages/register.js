import { useState } from 'react'
import { useRouter } from 'next/router'
import { signIn } from 'next-auth/react'
import Navbar from '../components/Navbar'

export default function Register(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stage, setStage] = useState('idle') // idle | welcome | terms
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if(password !== confirm){
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try{
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role: 'buyer' })
      })
      const data = await res.json().catch(()=> ({}))
      if(!res.ok){
        throw new Error(data?.error || 'Failed to register')
      }
      // Hold sign-in until user completes welcome + terms
      setNewUserEmail(email)
      setNewUserPassword(password)
      setStage('welcome')
    }catch(e){
      setError(e.message || 'Registration failed')
    }finally{
      setLoading(false)
    }
  }

  const proceedToTerms = () => {
    setStage('terms')
  }

  const completeAndSignIn = async () => {
    if(!termsAccepted) return
    setLoading(true)
    try{
      const signInRes = await signIn('credentials', { email: newUserEmail, password: newUserPassword, redirect: false })
      if(signInRes && !signInRes.error){
        router.push('/market')
      }else{
        router.push('/credentials')
      }
    }catch(e){
      setError(e.message || 'Sign-in failed')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="container center">
        <div style={{maxWidth:420,width:'100%'}}>
          <div className="card">
            <h2 style={{textAlign:'center',color:'#A020F0'}}>Register with Email & Password</h2>
            <form onSubmit={submit} style={{marginTop:16}}>
              <label style={{display:'block',fontWeight:600,marginBottom:8}}>Email</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />

              <label style={{display:'block',fontWeight:600,margin:'12px 0 8px'}}>Name (optional)</label>
              <input className="input" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name" />

              <label style={{display:'block',fontWeight:600,margin:'12px 0 8px'}}>Password</label>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required />

              <label style={{display:'block',fontWeight:600,margin:'12px 0 8px'}}>Confirm Password</label>
              <input className="input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat your password" autoComplete="new-password" required />

              {error && <div className="small" style={{color:'#b91c1c',marginTop:10}}>{error}</div>}

              <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:16}}>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Creating account…' : 'Register'}
                </button>
                <a href="/login" className="btn btn-ghost">Back</a>
              </div>

              <div className="small" style={{marginTop:12,opacity:0.75,textAlign:'center'}}>
                Already have an account? <a href="/credentials" className="link">Sign in</a>
              </div>
            </form>
          </div>
        </div>
      </div>

      {stage === 'welcome' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#0b1220',color:'#e2e8f0',padding:24,borderRadius:12,border:'1px solid #312e81',maxWidth:520,width:'90%',boxShadow:'0 16px 48px rgba(0,0,0,0.35)',position:'relative'}}>
            <button onClick={proceedToTerms} aria-label="Close" style={{position:'absolute',top:12,right:12,background:'transparent',border:'1px solid #475569',color:'#e2e8f0',borderRadius:6,width:28,height:28,cursor:'pointer',fontWeight:700}}>×</button>
            <h3 style={{marginTop:0,color:'#c084fc'}}>Welcome! Your account is ready</h3>
            <p style={{marginBottom:8}}>We curate quality goods sourced from trusted suppliers. Each product lists its origin, so you know exactly where it comes from.</p>
            <p style={{marginBottom:8}}>Find items locally by checking store availability in your area, or order online for direct delivery.</p>
            <p style={{marginBottom:12}}>We will add deeper product insights (materials, sourcing stories, care tips) soon.</p>
            <label style={{display:'flex',alignItems:'center',gap:8,marginTop:8,fontWeight:600}}>
              <input type="checkbox" checked={newsletterOptIn} onChange={e=>setNewsletterOptIn(e.target.checked)} />
              Send me news and updates to my inbox
            </label>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:16,gap:10}}>
              <button className="btn btn-primary" onClick={proceedToTerms}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {stage === 'terms' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100}}>
          <div style={{background:'#0b1220',color:'#e2e8f0',padding:24,borderRadius:12,border:'1px solid #334155',maxWidth:580,width:'92%',boxShadow:'0 18px 52px rgba(0,0,0,0.4)',position:'relative'}}>
            <h3 style={{marginTop:0,color:'#c084fc'}}>Terms & Conditions</h3>
            <div style={{fontSize:14, lineHeight:1.55, maxHeight:'50vh', overflowY:'auto', paddingRight:4}}>
              <p style={{margin:'0 0 10px'}}>By continuing you agree to the Marketplace Terms and Conditions:</p>
              <ul style={{paddingLeft:18,margin:'0 0 12px',color:'#cbd5e1'}}>
                <li>Products, pricing, and availability may change; always review details before purchase.</li>
                <li>Deliveries and pickups rely on partner carriers and local store stock status.</li>
                <li>We may contact you about orders, account security, and product updates.</li>
                <li>Returns and refunds follow the policy shown at checkout for your region.</li>
              </ul>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:8,marginTop:14,fontWeight:600}}>
              <input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} />
              I accept the Terms & Conditions
            </label>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:16,gap:10}}>
              <button className="btn btn-primary" onClick={completeAndSignIn} disabled={!termsAccepted || loading}>
                {loading ? 'Continuing…' : 'Accept & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
