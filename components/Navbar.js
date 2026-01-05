import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import WebcamLogo from './WebcamLogo'

export default function Navbar(){
  const { data: session } = useSession()
  const email = session?.user?.email || ''
  const isAdmin = email === 'admin@local.test'
  return (
    <header className="nav">
      <div className="nav-inner container">
        <Link href="/" className="nav-brand"><WebcamLogo /></Link>
        <nav className="nav-links">
          <Link href="/market">Market</Link>
          {session ? <Link href="/agent/tools">Agent Tools</Link> : null}
          {session && isAdmin ? <Link href="/admin/tools">Admin Tools</Link> : null}
          {session?
            <>
              <span className="nav-user" style={{display:'flex',flexDirection:'column',lineHeight:1.1}}>
                <span style={{fontWeight:700}}>{isAdmin ? 'Admin Account' : 'User Account'}</span>
                {isAdmin ? <span className="small" style={{opacity:.85}}>User1 account: user1@local.test</span> : <span className="small" style={{opacity:.85}}>{session.user?.name || session.user?.email}</span>}
              </span>
              <button className="btn btn-ghost" onClick={()=>signOut()}>Sign out</button>
            </>
            : <Link href="/login"><button className="btn btn-ghost">Sign in</button></Link>
          }
        </nav>
      </div>
    </header>
  )
}
