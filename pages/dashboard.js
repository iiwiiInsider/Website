import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isAdmin = session?.user?.email === 'admin@local.test'
  const [adminUsers, setAdminUsers] = useState([])
  const [adminLogins, setAdminLogins] = useState([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoading(false)
      return
    }

    if (status !== 'authenticated') return

    const loadDashboard = async () => {
      try {
        const res = await fetch('/api/analytics/dashboard')
        const data = await res.json()
        if (res.ok) {
          setDashboard(data.dashboard)
        } else {
          setError(data.error || 'Failed to load dashboard')
        }
      } catch (e) {
        setError('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
    // Admin-only: load users and logins
    if(isAdmin){
      fetch('/api/admin/users').then(r=>r.json()).then(d=>{
        if(d?.users) setAdminUsers(d.users)
      }).catch(()=>{})
      fetch('/api/admin/logins').then(r=>r.json()).then(d=>{
        if(d?.logins) setAdminLogins(d.logins)
      }).catch(()=>{})
    }
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Loading dashboard…</h3>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Sign in required</h3>
            <p>Please sign in to view your dashboard.</p>
            <a href="/login" className="btn btn-primary">Sign In</a>
          </div>
        </div>
      </div>
    )
  }

  const metrics = dashboard?.userMetrics || {}
  const adminStats = dashboard?.adminStats || null

  return (
    <div>
      <Navbar />
      <main className="container">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>
            {isAdmin ? 'Admin Dashboard' : 'Revenue & Engagement Dashboard'}
          </h2>

          {error && <div style={{ color: '#dc2626', marginBottom: 16 }}>{error}</div>}

          {/* User/Agent Metrics */}
          {!isAdmin && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Your Performance</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginBottom: 24
              }}>
                <div style={{
                  background: 'rgba(79, 70, 229, 0.08)',
                  border: '1px solid rgba(79, 70, 229, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Total Revenue</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    R{metrics.totalRevenue?.toLocaleString() || '0'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Total Transactions</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {metrics.totalTransactions || '0'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Avg Transaction</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    R{metrics.avgTransactionValue?.toLocaleString() || '0'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(251, 146, 60, 0.08)',
                  border: '1px solid rgba(251, 146, 60, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Rating</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {metrics.averageRating ? `${metrics.averageRating}★` : 'New'}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    ({metrics.totalReviews} reviews)
                  </div>
                </div>
              </div>

              {/* Engagement */}
              <h3 style={{ marginTop: 24, marginBottom: 12 }}>Engagement</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
                marginBottom: 24
              }}>
                <div style={{ padding: 12, background: '#f3f4f6', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Properties Viewed</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {metrics.engagement?.viewed || '0'}
                  </div>
                </div>
                <div style={{ padding: 12, background: '#f3f4f6', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Listings Claimed</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {metrics.engagement?.claimed || '0'}
                  </div>
                </div>
                <div style={{ padding: 12, background: '#f3f4f6', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Inquiries Sent</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {metrics.engagement?.inquiries || '0'}
                  </div>
                </div>
                <div style={{ padding: 12, background: '#f3f4f6', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Messages Sent</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {metrics.engagement?.messages || '0'}
                  </div>
                </div>
              </div>

              {metrics.lastActivity && (
                <div style={{ fontSize: 12, color: '#999' }}>
                  Last active: {new Date(metrics.lastActivity).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Admin Stats */}
          {isAdmin && adminStats && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Platform Overview</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginBottom: 24
              }}>
                <div style={{
                  background: 'rgba(79, 70, 229, 0.08)',
                  border: '1px solid rgba(79, 70, 229, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Total Transactions</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {adminStats.totalTransactions}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Platform Earnings</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    R{adminStats.platformEarnings?.toLocaleString() || '0'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Active Agents</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {adminStats.totalAgents}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(251, 146, 60, 0.08)',
                  border: '1px solid rgba(251, 146, 60, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Gross Marketplace Volume</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    R{adminStats.totalRevenue?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Admin: Registered Users</h3>
              <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Role</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>User ID</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u.id}>
                        <td style={{ padding: 8 }}>{u.email}</td>
                        <td style={{ padding: 8 }}>{u.name || '-'}</td>
                        <td style={{ padding: 8 }}>{u.role || '-'}</td>
                        <td style={{ padding: 8 }}>{u.id}</td>
                        <td style={{ padding: 8 }}>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                    {adminUsers.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: 8, color: '#666' }}>No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h3 style={{ marginTop: 24, marginBottom: 12 }}>Admin: Recent Logins</h3>
              <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Platform</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>User Agent</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>IP</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Time</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminLogins.map((r, i) => (
                      <tr key={`${r.email}-${r.time}-${i}`}>
                        <td style={{ padding: 8 }}>{r.email || '-'}</td>
                        <td style={{ padding: 8 }}>{r.platform || '-'}</td>
                        <td style={{ padding: 8 }}>{(r.userAgent || '').slice(0, 80)}</td>
                        <td style={{ padding: 8 }}>{r.ip || '-'}</td>
                        <td style={{ padding: 8 }}>{new Date(r.time).toLocaleString()}</td>
                        <td style={{ padding: 8 }}>{r.source || '-'}</td>
                      </tr>
                    ))}
                    {adminLogins.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 8, color: '#666' }}>No login records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
