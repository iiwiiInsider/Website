import { useSession } from 'next-auth/react'
import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function AdminPage(){
  const { data: session, status } = useSession()
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
          <h2 style={{marginTop:0}}>Admin</h2>
          <div className="small" style={{marginBottom:12}}>You are signed in as <strong>{email}</strong>.</div>

          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}>
            <Link href="/admin/tools"><button className="btn btn-primary">Open Admin Tools</button></Link>
            <Link href="/admin/agents"><button className="btn btn-outline">Manage Agents</button></Link>
          </div>

          <div className="card" style={{background:'transparent'}}>
            <h3 style={{marginTop:0}}>User1 account</h3>
            <div className="small"><strong>Email:</strong> user1@local.test</div>
            <div className="small" style={{marginTop:8}}>This is a local testing account added for front-end login verification.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
