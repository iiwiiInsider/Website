import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function Home(){
  return (
    <div>
      <Navbar />

      <main className="container landing">
        <section className="landing-hero" aria-label="Hero">
          <div className="landing-hero-inner">
            <h1 className="landing-title">Sell and buy on the<br/>live market today</h1>
            <p className="landing-subtitle">Discover listings and buy, sell for your gain.</p>
            <div className="landing-cta">
              <Link href="/market" className="btn btn-primary">Buy Now</Link>
              <Link href="/login" className="btn btn-ghost">Sell Now</Link>
            </div>
          </div>
          <div className="landing-hero-art" aria-hidden="true">
            <span className="orb orb-a" />
            <span className="orb orb-b" />
            <span className="orb orb-c" />
            <span className="orb orb-d" />
          </div>
        </section>

        <section className="landing-section" aria-label="Contact">
          <div className="landing-cta-card">
            <h2 className="landing-h2">Still Have Any Question?</h2>
            <p className="landing-muted">If you still have any questions, feel free to reach out to our support team for quick assistance and detailed answers.</p>
            <a className="btn btn-white" href="mailto:support@local.test">Contact Us</a>
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
              <Link href="/market">Market</Link>
              <Link href="/login">Sign in</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
