import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function Home(){
  return (
    <div>
      <Navbar />

      <main className="container landing">
        <section className="landing-hero" aria-label="Hero">
          <div className="landing-hero-inner">
            <h1 className="landing-title">Buy and sell items on the<br/>live market today</h1>
            <p className="landing-subtitle">Discover listings from trusted listers and shop with confidence.</p>
            <div className="landing-cta">
              <Link href="/market" className="btn btn-primary">Browse Market</Link>
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
              <Link href="/admin-login" style={{color:'#ff3b3b',fontWeight:700}}>Admin</Link>
              <a href="mailto:support@local.test">Contact Us</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
