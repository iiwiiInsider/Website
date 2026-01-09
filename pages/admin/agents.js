import { useSession } from 'next-auth/react'
import Navbar from '../../components/Navbar'

export default function ManageAgents(){
  const { data: session, status } = useSession() ?? {}
  const isAdmin = (session?.user?.email || '') === 'admin@local.test'

  if(status === 'loading'){
    return (
      <div>
        <Navbar />
        <div className="container center"><div className="card">Loading…</div></div>
      </div>
    )
  }

  if(!session || !isAdmin){
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3 style={{marginTop:0}}>Admin only</h3>
            <div className="small">Sign in as <strong>admin@local.test</strong> to view admin pages.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container center">
        <div className="card" style={{maxWidth:520}}>
          <h2 style={{marginTop:0}}>Agents feature removed</h2>
          <p className="small" style={{marginTop:8}}>
            Agent management has been retired from the admin panel. No agent data is being loaded or edited.
          </p>
          <p className="small" style={{marginTop:8}}>
            Please use the other admin tools to manage users, listings, analytics, and system settings.
          </p>
          <div style={{marginTop:16,display:'flex',gap:10,flexWrap:'wrap'}}>
            <a className="btn btn-primary" href="/admin/dashboard">Go to Dashboard</a>
            <a className="btn btn-ghost" href="/admin/users">Manage Users</a>
          </div>
        </div>
      </div>
    </div>
  )
}
