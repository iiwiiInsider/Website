import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '../../components/Navbar'

export default function PageViews(){
  const { data: session, status } = useSession() ?? {}
  const [pageViews, setPageViews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')

  useEffect(() => {
    if(status === 'authenticated'){
      loadPageViews()
    }
  }, [status])

  const loadPageViews = async () => {
    try{
      const res = await fetch('/api/admin/page-views')
      if(res.ok){
        const data = await res.json()
        setPageViews(data.pageViews || [])
      }
    }catch(e){
      console.error('Failed to load page views:', e)
    }finally{
      setLoading(false)
    }
  }

  if(status === 'loading' || loading){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card"><h3>Loading…</h3></div>
        </div>
      </div>
    )
  }

  if(status === 'unauthenticated' || session?.user?.email !== 'admin@local.test'){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card">
            <h3>Admin only</h3>
            <p>You must be signed in as admin to view this page.</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredViews = pageViews.filter(view => {
    const matchesPage = !filter || view.page.toLowerCase().includes(filter.toLowerCase())
    const matchesUser = !userFilter || view.email.toLowerCase().includes(userFilter.toLowerCase())
    return matchesPage && matchesUser
  })

  const stats = {
    total: pageViews.length,
    uniqueUsers: new Set(pageViews.map(v => v.email)).size,
    uniquePages: new Set(pageViews.map(v => v.page)).size
  }

  const topPages = Object.entries(
    pageViews.reduce((acc, view) => {
      acc[view.page] = (acc[view.page] || 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const topUsers = Object.entries(
    pageViews.reduce((acc, view) => {
      acc[view.email] = (acc[view.email] || 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 10)

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="card">
          <h2 style={{marginTop:0}}>Page View Analytics</h2>
          
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:16,marginTop:16}}>
            <div style={{padding:16,background:'rgba(160,32,240,0.08)',borderRadius:8,border:'1px solid rgba(160,32,240,0.2)'}}>
              <div style={{fontSize:14,color:'var(--muted)'}}>Total Page Views</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>{stats.total}</div>
            </div>
            <div style={{padding:16,background:'rgba(0,255,255,0.08)',borderRadius:8,border:'1px solid rgba(0,255,255,0.2)'}}>
              <div style={{fontSize:14,color:'var(--muted)'}}>Unique Users</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>{stats.uniqueUsers}</div>
            </div>
            <div style={{padding:16,background:'rgba(0,255,0,0.08)',borderRadius:8,border:'1px solid rgba(0,255,0,0.2)'}}>
              <div style={{fontSize:14,color:'var(--muted)'}}>Unique Pages</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>{stats.uniquePages}</div>
            </div>
          </div>

          <div style={{marginTop:24,display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <h3 style={{marginTop:0}}>Top Pages</h3>
              <div style={{fontSize:14}}>
                {topPages.map(([page, count]) => (
                  <div key={page} style={{padding:'8px 0',borderBottom:'1px solid var(--border-soft)',display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontFamily:'monospace',fontSize:13}}>{page}</span>
                    <span style={{fontWeight:700,color:'var(--accent-cyan)'}}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{marginTop:0}}>Top Users</h3>
              <div style={{fontSize:14}}>
                {topUsers.map(([email, count]) => (
                  <div key={email} style={{padding:'8px 0',borderBottom:'1px solid var(--border-soft)',display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:13}}>{email}</span>
                    <span style={{fontWeight:700,color:'var(--accent-cyan)'}}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{marginTop:0}}>Recent Page Views</h3>
          
          <div style={{display:'flex',gap:12,marginTop:12,flexWrap:'wrap'}}>
            <input
              className="input"
              placeholder="Filter by page..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{flex:1,minWidth:200,marginTop:0}}
            />
            <input
              className="input"
              placeholder="Filter by user..."
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              style={{flex:1,minWidth:200,marginTop:0}}
            />
          </div>

          <div style={{marginTop:16,overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--border)'}}>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Timestamp</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>User</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Page</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Referrer</th>
                </tr>
              </thead>
              <tbody>
                {filteredViews.slice().reverse().slice(0, 100).map((view, idx) => (
                  <tr key={idx} style={{borderBottom:'1px solid var(--border-soft)'}}>
                    <td style={{padding:'10px 8px',fontSize:13,fontFamily:'monospace'}}>
                      {new Date(view.timestamp).toLocaleString()}
                    </td>
                    <td style={{padding:'10px 8px',fontSize:13}}>{view.email}</td>
                    <td style={{padding:'10px 8px',fontSize:13,fontFamily:'monospace',color:'var(--accent-cyan)'}}>{view.page}</td>
                    <td style={{padding:'10px 8px',fontSize:12,color:'var(--muted)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {view.referrer || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredViews.length === 0 && (
              <div style={{padding:32,textAlign:'center',color:'var(--muted)'}}>
                No page views found
              </div>
            )}
            {filteredViews.length > 100 && (
              <div style={{padding:16,textAlign:'center',fontSize:14,color:'var(--muted)'}}>
                Showing 100 most recent of {filteredViews.length} total views
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
