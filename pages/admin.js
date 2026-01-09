import { useSession } from 'next-auth/react'
import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function AdminPage(){
  const { data: session, status } = useSession() ?? {}
  const email = session?.user?.email || ''
  const isAdmin = email === 'admin@local.test'

  const actions = [
    {
      href: '/admin/listings',
      title: 'Listings',
      icon: '📋',
      blurb: 'Review and manage all property listings',
      tone: '#a855f7',
      badge: 'Inventory'
    },
    {
      href: '/admin/users',
      title: 'Users',
      icon: '👥',
      blurb: 'Roles, permissions, and account health',
      tone: '#c084fc',
      badge: 'Identity'
    },
    {
      href: '/admin/page-views',
      title: 'Analytics',
      icon: '📊',
      blurb: 'Traffic, engagement, and conversion',
      tone: '#d946ef',
      badge: 'Insights'
    },
    {
      href: '/admin/tools',
      title: 'Admin Tools',
      icon: '⚙️',
      blurb: 'Data hygiene and maintenance utilities',
      tone: '#8b5cf6',
      badge: 'Ops'
    },
    {
      href: '/market',
      title: 'Back to Market',
      icon: '↩️',
      blurb: 'Return to the shopper experience',
      tone: '#6b7280',
      badge: 'Exit'
    }
  ]

  if(status === 'loading'){
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">Loading…</div>
        </div>
      </div>
    )
  }

  if(!session || !isAdmin){
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Admin only</h3>
            <div className="small">Sign in as <strong>admin@local.test</strong> to access this page.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{marginTop:24, display:'grid', gap:16}}>
        <div className="card" style={{
          background:'linear-gradient(135deg, #120422 0%, #241040 45%, #3a1a66 100%)',
          color:'white',
          padding:'24px',
          border:'1px solid rgba(255,255,255,0.08)',
          boxShadow:'0 16px 40px rgba(10, 0, 25, 0.45)',
          backdropFilter:'blur(4px)'
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
            <div>
              <div style={{fontSize:13,letterSpacing:1,opacity:0.8,textTransform:'uppercase'}}>Admin Settings</div>
              <h2 style={{margin:'6px 0 4px 0'}}>Control Panel</h2>
              <div style={{opacity:0.9}}>Signed in as {email}</div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <span style={{padding:'6px 10px',borderRadius:999,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.25)',fontSize:12}}>Role: Admin</span>
              <span style={{padding:'6px 10px',borderRadius:999,background:'rgba(168,85,247,0.18)',border:'1px solid rgba(168,85,247,0.45)',fontSize:12,color:'#f5e1ff'}}>Core Access</span>
            </div>
          </div>
        </div>

        <div className="card" style={{padding:'20px', background:'linear-gradient(135deg, rgba(18,4,34,0.85) 0%, rgba(25,13,45,0.95) 100%)', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'0 12px 28px rgba(12,4,32,0.25)'}}>
          <h3 style={{marginTop:0,marginBottom:12, color:'#e5e7ff'}}>Admin Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {actions.map((action) => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    padding: '16px',
                    border: `1px solid ${action.tone}40`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: `linear-gradient(135deg, ${action.tone}22 0%, rgba(17, 12, 34, 0.75) 100%)`,
                    boxShadow: '0 10px 26px rgba(12, 4, 32, 0.22)',
                    backdropFilter: 'blur(3px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 14px 32px rgba(12, 4, 32, 0.35)'
                    e.currentTarget.style.borderColor = action.tone
                    e.currentTarget.style.background = `linear-gradient(135deg, ${action.tone}33 0%, rgba(14, 6, 26, 0.9) 100%)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 10px 26px rgba(12, 4, 32, 0.22)'
                    e.currentTarget.style.borderColor = `${action.tone}40`
                    e.currentTarget.style.background = `linear-gradient(135deg, ${action.tone}22 0%, rgba(17, 12, 34, 0.75) 100%)`
                  }}
                  aria-label={`${action.title} admin action`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ margin: 0, color: action.tone, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{action.icon}</span>
                      {action.title}
                    </h4>
                    <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, backgroundColor: `${action.tone}18`, color: action.tone, border: `1px solid ${action.tone}50` }}>{action.badge}</span>
                  </div>
                  <p style={{ margin: 0, color: '#dfe4ff', fontSize: '13px', lineHeight: 1.5 }}>{action.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', background:'linear-gradient(135deg, rgba(18,4,34,0.9) 0%, rgba(30,16,52,0.92) 100%)', border:'1px solid rgba(255,255,255,0.06)', color:'#e5e7ff' }}>
          <div style={{fontSize:14}}>
            <strong>Admin Account:</strong> {email}
          </div>
          <div style={{fontSize:14,marginTop:8,opacity:0.8}}>
            Dedicated admin login at <Link href="/admin-login" style={{color:'#c084fc',textDecoration:'underline'}}>admin-login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
