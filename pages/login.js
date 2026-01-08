import { getProviders, signIn } from 'next-auth/react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import AuthButtons from '../components/AuthButtons'

export default function Login({ providers }){
  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(circle at 20% 20%, rgba(160,32,240,0.2), transparent 30%), radial-gradient(circle at 80% 0%, rgba(0,200,255,0.12), transparent 32%), #0b1220'}}>
      <Navbar />
      <div className="container" style={{display:'flex',justifyContent:'center',alignItems:'center',padding:'64px 16px'}}>
        <div style={{maxWidth:440,width:'100%'}}>
          <div style={{background:'rgba(12,18,32,0.9)',border:'1px solid #1f2a44',borderRadius:16,padding:24,boxShadow:'0 20px 50px rgba(0,0,0,0.45)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
              <div>
                <div style={{fontSize:13,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em'}}>Marketplace Access</div>
                <h2 style={{margin:'6px 0 4px',color:'#A020F0'}}>Sign in or create an account</h2>
                <p style={{margin:0,color:'#cbd5e1',fontSize:14}}>Shop local picks, see sourcing details, and track your orders.</p>
              </div>
              <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,#A020F0,#4f46e5)',display:'grid',placeItems:'center',color:'#fff',fontWeight:800,fontSize:18}}>M</div>
            </div>

            <div style={{marginTop:20}}>
              <AuthButtons providers={providers} />
            </div>

            <div style={{display:'grid',gap:10,marginTop:16}}>
              <Link href="/credentials"><button className="btn btn-primary" style={{width:'100%'}}>Continue with email</button></Link>
              <Link href="/register"><button className="btn btn-outline" style={{width:'100%'}}>Create a new account</button></Link>
              <Link href="/" style={{textAlign:'center'}}><button className="btn btn-ghost" style={{width:'100%'}}>Back to home</button></Link>
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
