import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function About(){
  return (
    <div>
      <Navbar />

      <main className="container landing">
        <section className="landing-section" style={{marginTop:32}}>
          <div className="landing-cta-card">
            <h1 className="landing-h2" style={{marginBottom:16}}>About Us</h1>
            <p className="landing-muted" style={{fontSize:16,lineHeight:1.8,marginTop:16}}>
              Welcome to our marketplace, built purely for confident buying. We curate offers from vetted suppliers so you can discover and purchase with ease.
            </p>
            <p className="landing-muted" style={{fontSize:16,lineHeight:1.8,marginTop:16}}>
              Our mission is to help you buy better—through transparent pricing, verified sourcing, and a seamless shopping experience. From everyday essentials to unique local finds, we handle the vetting so you can shop with trust.
            </p>
          </div>
        </section>

        <section className="landing-section" style={{marginTop:24}}>
          <h2 className="landing-h2" style={{textAlign:'center'}}>Our Values</h2>
          <div className="landing-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',marginTop:20}}>
            <div className="landing-post">
              <div className="landing-post-media media-a" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:48}}>
                🎯
              </div>
              <div className="landing-post-body">
                <h3 className="landing-post-title">Transparency</h3>
                <p className="landing-muted" style={{marginTop:8}}>
                  We believe in clear pricing, honest communication, and transparent processes for all our users.
                </p>
              </div>
            </div>

            <div className="landing-post">
              <div className="landing-post-media media-b" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:48}}>
                🔒
              </div>
              <div className="landing-post-body">
                <h3 className="landing-post-title">Security</h3>
                <p className="landing-muted" style={{marginTop:8}}>
                  Your data and transactions are protected with industry-leading security measures.
                </p>
              </div>
            </div>

            <div className="landing-post">
              <div className="landing-post-media media-c" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:48}}>
                ⚡
              </div>
              <div className="landing-post-body">
                <h3 className="landing-post-title">Innovation</h3>
                <p className="landing-muted" style={{marginTop:8}}>
                  We continuously improve our platform with the latest technology and user-driven features.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" style={{marginTop:32}}>
          <div className="landing-cta-card">
            <h2 className="landing-h2">Get Started Today</h2>
            <p className="landing-muted" style={{marginTop:12}}>
              Join thousands of users who trust our platform for smarter, safer buying.
            </p>
            <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:20,flexWrap:'wrap'}}>
              <Link href="/register" className="btn btn-primary">Create Account</Link>
              <Link href="/market" className="btn btn-white">Browse Market</Link>
            </div>
          </div>
        </section>

        <footer className="landing-footer" aria-label="Footer">
          <div className="landing-footer-inner">
            <div className="landing-footer-left">
              <div className="brand-mark">BurnProjects</div>
              <div className="landing-muted">© BurnProjects. All rights reserved</div>
            </div>
            <div className="landing-footer-links">
              <Link href="/">Home</Link>
              <Link href="/about">About Us</Link>
              <Link href="/market">Market</Link>
              <Link href="/login">Sign in</Link>
              <Link href="/admin-login" style={{color:'#ff3b3b',fontWeight:700}}>Admin</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
