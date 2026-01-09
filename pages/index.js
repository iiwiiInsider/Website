import Link from 'next/link'
import Head from 'next/head'

export default function Home(){
  return (
    <div>
      <Head>
        <title>BurnProjects Marketplace - Buy Items Online</title>
      </Head>

      <main className="container landing">
        <section className="landing-hero" aria-label="Hero">
          <div className="landing-hero-inner" style={{alignItems:'center',textAlign:'center'}}>
            <h1 className="landing-title">Buy with confidence<br/>trusted by locals</h1>
            <p className="landing-subtitle">Discover listings from trusted listers and shop with confidence.</p>

            <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:16,justifyContent:'center'}}>
              <Link href="/login" className="btn btn-primary">Browse Market</Link>
              <a href="mailto:support@burnprojects.com" className="btn btn-outline">Contact Us</a>
            </div>

            <div style={{marginTop:18,display:'grid',gap:12,maxWidth:600,justifyItems:'center'}}>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
                <span style={{padding:'8px 12px',borderRadius:12,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'#e5e7ff',fontSize:12,letterSpacing:0.2}}>Trusted by 5k+ shoppers</span>
                <span style={{padding:'8px 12px',borderRadius:12,background:'rgba(160,32,240,0.14)',border:'1px solid rgba(160,32,240,0.35)',color:'#f4e7ff',fontSize:12}}>Buyer protection included</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))',gap:10,justifyItems:'center',width:'100%'}}>
                <div style={{padding:'12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(12,18,32,0.35)',width:'100%',maxWidth:260}}>
                  <div style={{color:'#cbd5e1',fontSize:13,marginBottom:6}}>Average delivery rating</div>
                  <div style={{color:'#f8fafc',fontSize:22,fontWeight:700}}>4.8 / 5</div>
                </div>
                <div style={{padding:'12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(12,18,32,0.35)',width:'100%',maxWidth:260}}>
                  <div style={{color:'#cbd5e1',fontSize:13,marginBottom:6}}>Verified local sellers</div>
                  <div style={{color:'#f8fafc',fontSize:22,fontWeight:700}}>2,300+</div>
                </div>
              </div>
            </div>
          </div>
          <div className="landing-hero-art" aria-hidden="true">
            <span className="orb orb-a" />
            <span className="orb orb-b" />
            <span className="orb orb-c" />
            <span className="orb orb-d" />
          </div>
        </section>

        <footer className="landing-footer" aria-label="Footer">
          <div className="landing-footer-inner">
            <div className="landing-footer-left">
              <div className="brand-mark">BurnProjects</div>
              <div className="landing-muted">© BurnProjects. All rights reserved</div>
            </div>
            <div className="landing-footer-links">
              <Link href="/about">About Us</Link>
              <Link href="/market">Market</Link>
              <Link href="/login">Sign in</Link>
              <a href="mailto:support@burnprojects.com">Contact Us</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
