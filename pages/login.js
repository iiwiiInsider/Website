import { getProviders, signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AuthButtons from '../components/AuthButtons'

export default function Login({ providers }){
  const router = useRouter()
  const { data: session, status } = useSession() ?? {}
  const [showInfo, setShowInfo] = useState(false)

  useEffect(()=>{
    if(status === 'authenticated' && session?.user){
      router.replace('/about')
    }
  }, [status, session?.user, router])

  if(status === 'authenticated'){
    return null
  }
  return (
    <div style={{
      minHeight:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      padding:'48px 16px',
      background:'radial-gradient(circle at 20% 20%, rgba(160,32,240,0.2), transparent 30%), radial-gradient(circle at 80% 0%, rgba(0,200,255,0.12), transparent 32%), #0b1220'
    }}>
      <div className="container" style={{display:'flex',justifyContent:'center',alignItems:'center',width:'100%'}}>
        <div style={{maxWidth:440,width:'100%'}}>
          <div style={{background:'rgba(12,18,32,0.9)',border:'1px solid #1f2a44',borderRadius:16,padding:24,boxShadow:'0 20px 50px rgba(0,0,0,0.45)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
              <div>
                <div style={{fontSize:13,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em'}}>Marketplace Access</div>
                <h2 style={{margin:'6px 0 4px',color:'#A020F0'}}>Sign in or create an account</h2>
                <p style={{margin:0,color:'#cbd5e1',fontSize:14}}>Shop local picks, see sourcing details, and track your orders.</p>
              </div>
            </div>

            <div style={{marginTop:20}}>
              <AuthButtons providers={providers} />
            </div>

            <div style={{display:'grid',gap:10,marginTop:16}}>
              <Link href="/credentials"><button className="btn btn-primary" style={{width:'100%'}}>Continue with email</button></Link>
              <Link href="/register"><button className="btn btn-outline" style={{width:'100%'}}>Create a new account</button></Link>
              <Link href="/" style={{textAlign:'center'}}><button className="btn btn-ghost" style={{width:'100%'}}>Back to home</button></Link>
            </div>

            <div style={{marginTop:16,borderTop:'1px solid #1f2a44',paddingTop:16}}>
              <button 
                onClick={() => setShowInfo(!showInfo)}
                style={{
                  background:'none',
                  border:'none',
                  color:'#64748b',
                  cursor:'pointer',
                  fontSize:13,
                  display:'flex',
                  alignItems:'center',
                  gap:8,
                  width:'100%'
                }}
              >
                <span style={{fontSize:16}}>{showInfo ? '▼' : '▶'}</span>
                <span>🔒 How is my login data handled?</span>
              </button>
              
              {showInfo && (
                <div style={{
                  marginTop:12,
                  padding:12,
                  background:'rgba(100,116,139,0.08)',
                  border:'1px solid rgba(100,116,139,0.2)',
                  borderRadius:8,
                  fontSize:13,
                  color:'#cbd5e1',
                  lineHeight:'1.6'
                }}>
                  <p style={{margin:'0 0 8px 0'}}>
                    <strong>Login Data:</strong> Your login credentials are securely encrypted and filed in our database.
                  </p>
                  <p style={{margin:'0 0 8px 0'}}>
                    <strong>Account Creation:</strong> Accounts are created and managed via <strong>Google API services</strong>, ensuring enterprise-grade security and privacy compliance.
                  </p>
                  <p style={{margin:0}}>
                    <strong>Your Privacy:</strong> We follow strict data protection protocols and never share your personal information with third parties.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps(){
  const providers = await getProviders()
  return { props: { providers } }
}
