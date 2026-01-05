import Link from 'next/link'
import { useRouter } from 'next/router'

export default function OAuthError(){
  const router = useRouter()
  const error = String(router.query?.error || '')
  const emailMissing = error.toLowerCase() === 'accessdenied'
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{maxWidth:540,padding:24,textAlign:'center',borderRadius:12,boxShadow:'0 10px 30px rgba(2,6,23,0.08)',background:'#fff'}}>
        <h2 style={{color:'#A020F0'}}>OAuth Unavailable</h2>
        {emailMissing ? (
          <p style={{color:'#374151'}}>Your sign-in provider did not supply an email address. An email is required so listings can be assigned to an agent. Please sign in using email/password.</p>
        ) : (
          <p style={{color:'#374151'}}>The Google / Apple sign-in option is currently unavailable in this demo. Please use email/password to register or sign in.</p>
        )}
        <div style={{marginTop:18}}>
          <Link href="/login"><button style={{padding:'8px 14px',borderRadius:8,border:'none',background:'#A020F0',color:'#fff'}}>Back to Sign in</button></Link>
        </div>
      </div>
    </div>
  )
}
