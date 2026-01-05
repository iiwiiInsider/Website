import { getProviders, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import AuthButtons from '../components/AuthButtons'

export default function Login({ providers }){
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const sanitizeEmail = (value) => (value || '').trim().toLowerCase()

  const doCredentialsLogin = async ({ email: rawEmail, password: rawPassword, source }) => {
    setError(null)
    const normalizedEmail = sanitizeEmail(rawEmail)
    const safePassword = (rawPassword || '').trim()
    if(!normalizedEmail || !safePassword){
      setError('Email and password are required')
      return
    }
    setLoading(true)
    try{
      const res = await signIn('credentials', { redirect: false, email: normalizedEmail, password: safePassword })
      if(res?.error){
        setError(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error)
        return
      }
      try{
        const payload = {
          loggedIn: true,
          email: normalizedEmail,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          platform: typeof navigator !== 'undefined' ? navigator.platform : null,
          screen: typeof screen !== 'undefined' ? {width: screen.width, height: screen.height} : null,
          innerSize: typeof window !== 'undefined' ? {w: window.innerWidth, h: window.innerHeight} : null,
          language: typeof navigator !== 'undefined' ? navigator.language : null,
          timestamp: new Date().toISOString(),
          source: source || 'client'
        }
        await fetch('/api/tracking/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) }).catch(()=>null)
      }catch(e){/* ignore */}
      window.location.href = '/market'
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
            <div className="logo" style={{width:96,height:96,margin:'0 auto'}}>logo</div>
            <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:24,marginBottom:24}}>
              <button
                onClick={()=>setMode('login')}
                aria-pressed={mode==='login'}
                className="btn"
                style={{
                  padding:'8px 14px',
                  borderRadius:8,
                  border: mode === 'login' ? '2px solid #A020F0' : '1px solid #e6e9ef',
                  background: mode === 'login' ? 'rgba(160,32,240,0.08)' : 'transparent',
                  fontWeight:600,
                  color: mode === 'login' ? '#A020F0' : '#111'
                }}
              >
                Login
              </button>
              <button
                onClick={()=>setMode('register')}
                aria-pressed={mode==='register'}
                className="btn"
                style={{
                  padding:'8px 14px',
                  borderRadius:8,
                  border: mode === 'register' ? '2px solid #A020F0' : '1px solid #e6e9ef',
                  background: mode === 'register' ? 'rgba(160,32,240,0.08)' : 'transparent',
                  fontWeight:600,
                  color: mode === 'register' ? '#A020F0' : '#111'
                }}
              >
                Sign Up
              </button>
            </div>

            <h2 style={{textAlign:'center',color:'#A020F0'}}>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>

            <div style={{marginTop:8}}>
              <input id="email" className="input" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
              <input id="password" type="password" className="input" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
              <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
                <button className="btn btn-outline" onClick={async ()=>{
                  try{
                    if(mode === 'login'){
                      await doCredentialsLogin({ email, password, source: 'login-form' })
                    }else{
                      // register then sign in
                      const normalizedEmail = sanitizeEmail(email)
                      const safePassword = (password || '').trim()
                      if(!normalizedEmail || !safePassword){
                        setError('Email and password are required')
                        return
                      }
                      setLoading(true)
                      const res = await fetch('/api/local/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email: normalizedEmail, password: safePassword}) })
                      const data = await res.json().catch(()=>({error:'Failed'}))
                      if(!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }
                      await doCredentialsLogin({ email: normalizedEmail, password: safePassword, source: 'register' })
                    }
                  }catch(e){
                    setError(e.message || 'Unknown error')
                  }finally{ setLoading(false) }
                }}>{loading ? (mode==='login' ? 'Logging in...' : 'Registering...') : (mode === 'login' ? 'Login' : 'Register')}</button>
                <Link href="/"><button className="btn btn-ghost">Back</button></Link>
              </div>
              {error && <div style={{marginTop:10,color:'#b91c1c'}} className="small">{error}</div>}
            </div>

            <div className="card" style={{marginTop:16}}>
              <div style={{fontWeight:800,marginBottom:10}}>Group Login (testing)</div>
              <div className="small" style={{marginBottom:12}}>Quick sign-in buttons for the built-in test accounts.</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <button className="btn btn-outline" disabled={loading} onClick={async ()=>{
                  setEmail('admin@local.test')
                  setPassword('Admin123!')
                  await doCredentialsLogin({ email: 'admin@local.test', password: 'Admin123!', source: 'group-admin' })
                }}>Login as Admin</button>
                <button className="btn btn-outline" disabled={loading} onClick={async ()=>{
                  setEmail('user1@local.test')
                  setPassword('User1123!')
                  await doCredentialsLogin({ email: 'user1@local.test', password: 'User1123!', source: 'group-user1' })
                }}>Login as User1</button>
              </div>
            </div>

            <div style={{textAlign:'center',marginTop:12}} className="small">OR</div>

            <div style={{marginTop:12}}>
              <AuthButtons providers={providers} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps(context){
  const providers = await getProviders()
  return {props:{providers}}
}
