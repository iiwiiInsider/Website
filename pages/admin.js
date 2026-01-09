import { useSession } from 'next-auth/react'
import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function AdminPage(){
  const { data: session, status } = useSession() ?? {}
  const email = session?.user?.email || ''
  const isAdmin = email === 'admin@local.test'

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
      <div className="container">
        <div className="card">
          <h2 style={{marginTop:0}}>Admin Dashboard</h2>
          <div className="small" style={{marginBottom:12}}>You are signed in as <strong>{email}</strong>.</div>

          <div style={{marginTop:20}}>
            <h3 style={{marginTop:0,marginBottom:12}}>Management Tools</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:12}}>
              <Link href="/admin/listings" style={{textDecoration:'none'}}>
                <div style={{
                  padding:20,
                  background:'linear-gradient(135deg, rgba(160,32,240,0.12), rgba(160,32,240,0.08))',
                  border:'1px solid rgba(160,32,240,0.3)',
                  borderRadius:12,
                  cursor:'pointer',
                  transition:'all 0.2s ease'
                }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{fontSize:32,marginBottom:8}}>📋</div>
                  <h4 style={{margin:0,color:'var(--text)'}}>Manage Listings</h4>
                  <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>View, edit, and delete all property listings</p>
                </div>
              </Link>

              <Link href="/admin/users" style={{textDecoration:'none'}}>
                <div style={{
                  padding:20,
                  background:'linear-gradient(135deg, rgba(0,255,255,0.12), rgba(0,255,255,0.08))',
                  border:'1px solid rgba(0,255,255,0.3)',
                  borderRadius:12,
                  cursor:'pointer',
                  transition:'all 0.2s ease'
                }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{fontSize:32,marginBottom:8}}>👥</div>
                  <h4 style={{margin:0,color:'var(--text)'}}>Manage Users</h4>
                  <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Control user roles and permissions</p>
                </div>
              </Link>

              <Link href="/admin/agents" style={{textDecoration:'none'}}>
                <div style={{
                  padding:20,
                  background:'linear-gradient(135deg, rgba(0,255,0,0.12), rgba(0,255,0,0.08))',
                  border:'1px solid rgba(0,255,0,0.3)',
                  borderRadius:12,
                  cursor:'pointer',
                  transition:'all 0.2s ease'
                }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{fontSize:32,marginBottom:8}}>🏢</div>
                  <h4 style={{margin:0,color:'var(--text)'}}>Agent Management</h4>
                  <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>Manage agent profiles and permissions</p>
                </div>
              </Link>

              <Link href="/admin/page-views" style={{textDecoration:'none'}}>
                <div style={{
                  padding:20,
                  background:'linear-gradient(135deg, rgba(255,0,255,0.12), rgba(255,0,255,0.08))',
                  border:'1px solid rgba(255,0,255,0.3)',
                  borderRadius:12,
                  cursor:'pointer',
                  transition:'all 0.2s ease'
                }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{fontSize:32,marginBottom:8}}>📊</div>
                  <h4 style={{margin:0,color:'var(--text)'}}>Analytics</h4>
                  <p style={{fontSize:14,color:'var(--muted)',marginTop:6}}>View page views and user behavior</p>
                </div>
              </Link>
            </div>
          </div>

          <div style={{marginTop:24}}>
            <h3 style={{marginTop:0,marginBottom:12}}>Legacy Tools</h3>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <Link href="/admin/tools"><button className="btn btn-outline">Admin Tools</button></Link>
            </div>
          </div>

          <div style={{marginTop:20,padding:16,background:'rgba(0,255,255,0.08)',borderRadius:8,border:'1px solid rgba(0,255,255,0.2)'}}>
            <div style={{fontSize:14}}>
              <strong>Admin Account:</strong> {email}
            </div>
            <div style={{fontSize:14,marginTop:8,color:'var(--muted)'}}>
              Dedicated admin login available at <a href="/admin-login" style={{color:'var(--accent-cyan)',textDecoration:'underline'}}>/admin-login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
