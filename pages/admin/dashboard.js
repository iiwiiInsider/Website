import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Navbar from '../../components/Navbar'

export default function AdminDashboard(){
  const { data: session, status } = useSession() ?? {}
  const isAdmin = String(session?.user?.email || '').trim().toLowerCase() === 'admin@local.test'

  const actions = [
    {
      href: '/admin/users',
      title: 'Users',
      icon: '👥',
      blurb: 'Access control, password resets, and roles',
      tone: '#a855f7',
      badge: 'Identity'
    },
    {
      href: '/admin/products',
      title: 'Listings',
      icon: '📦',
      blurb: 'Create and tune marketplace supply',
      tone: '#c084fc',
      badge: 'Inventory'
    },
    {
      href: '/admin/page-views',
      title: 'Analytics',
      icon: '📊',
      blurb: 'Engagement, traffic, and conversion signals',
      tone: '#d946ef',
      badge: 'Insights'
    },
    {
      href: '/admin/tools',
      title: 'Admin Tools',
      icon: '⚙️',
      blurb: 'Data hygiene, maintenance, and audits',
      tone: '#8b5cf6',
      badge: 'Ops'
    },
    {
      href: '/market',
      title: 'Back to Market',
      icon: '↩️',
      blurb: 'Jump to the shopper view',
      tone: '#6b7280',
      badge: 'Exit'
    }
  ]

  if(status === 'loading'){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card"><h3>Loading…</h3></div>
        </div>
      </div>
    )
  }

  if(status === 'unauthenticated' || !isAdmin){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card">
            <h3>Admin Only</h3>
            <p>You must be signed in as admin@local.test to access this page.</p>
            <Link href="/admin-login">
              <button>Admin Login</button>
            </Link>
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
              <h2 style={{margin:'6px 0 4px 0'}}>Control Center</h2>
              <div style={{opacity:0.9}}>Welcome, {session?.user?.name || session?.user?.email}</div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <span style={{padding:'6px 10px',borderRadius:999,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.25)',fontSize:12}}>Role: Admin</span>
              <span style={{padding:'6px 10px',borderRadius:999,background:'rgba(0,200,83,0.15)',border:'1px solid rgba(0,200,83,0.4)',fontSize:12,color:'#baffc9'}}>Status: Active</span>
            </div>
          </div>
        </div>

        <div className="card" style={{padding:'20px'}}>
          <h3 style={{marginTop:0,marginBottom:12}}>Admin Actions</h3>
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

        <div className="card" style={{ padding: '18px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1d4ed8' }}>Admin Privileges</h4>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
            <li>Full user management (create, edit, delete, role assignment)</li>
            <li>Product/listing creation and management</li>
            <li>Bypass marketplace restrictions</li>
            <li>Access to analytics and engagement data</li>
            <li>View audit logs and page analytics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

