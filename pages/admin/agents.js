import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '../../components/Navbar'

export default function ManageAgents(){
  const { data: session, status } = useSession()
  const isAdmin = (session?.user?.email || '') === 'admin@local.test'

  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [savingEmail, setSavingEmail] = useState(null)
  const [editingEmail, setEditingEmail] = useState(null)

  const load = async ()=>{
    setError(null)
    setLoading(true)
    try{
      const res = await fetch('/api/admin/agents')
      const data = await res.json().catch(()=>({}))
      if(!res.ok) throw new Error(data?.error || 'Failed to load agents')
      setAgents(data.agents || [])
    }catch(e){
      setError(e.message || 'Failed to load agents')
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    if(status === 'authenticated' && isAdmin) load()
  },[status, isAdmin])

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
            <div className="small">Sign in as <strong>admin@local.test</strong> to manage agents.</div>
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
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <h2 style={{marginTop:0}}>Manage Agents</h2>
            <button className="btn btn-outline" onClick={load} disabled={loading}>Refresh</button>
          </div>

          {error && <div className="small" style={{color:'var(--accent-red)',marginTop:8}}>{error}</div>}
          {loading && <div className="small" style={{marginTop:8}}>Loading agent profiles…</div>}

          <div style={{marginTop:12,display:'grid',gap:12}}>
            {agents.map(a => (
              <div key={a.email} className="card" style={{background:'transparent'}}>
                <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:800}}>{a.profile?.displayName || 'Agent'}</div>
                    <div className="small"><strong>Email:</strong> {a.email}</div>
                    {a.profile?.updatedAt ? <div className="small">Updated: {new Date(a.profile.updatedAt).toLocaleString()}</div> : null}
                  </div>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    <button
                      className={editingEmail === a.email ? 'btn btn-outline' : 'btn btn-primary'}
                      onClick={()=>setEditingEmail(prev=> prev === a.email ? null : a.email)}
                      disabled={savingEmail === a.email}
                    >
                      {editingEmail === a.email ? 'Close' : 'Edit'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={async ()=>{
                        if(!confirm(`Remove agent profile for ${a.email}?`)) return
                        setSavingEmail(a.email)
                        setError(null)
                        try{
                          const res = await fetch(`/api/admin/agents?email=${encodeURIComponent(a.email)}`, { method:'DELETE' })
                          const data = await res.json().catch(()=>({}))
                          if(!res.ok) throw new Error(data?.error || 'Failed to remove')
                          if(editingEmail === a.email) setEditingEmail(null)
                          await load()
                        }catch(e){
                          setError(e.message || 'Failed to remove')
                        }finally{
                          setSavingEmail(null)
                        }
                      }}
                      disabled={savingEmail === a.email}
                    >
                      {savingEmail === a.email ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </div>

                {editingEmail === a.email ? (
                  <div style={{marginTop:12,display:'grid',gap:8}}>
                    <input
                      className="input"
                      value={a.email}
                      readOnly
                      aria-label="Agent email"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                    <input
                      className="input"
                      placeholder="Display name"
                      value={a.profile?.displayName || ''}
                      onChange={e=>setAgents(prev=>prev.map(x=>x.email===a.email?{...x,profile:{...(x.profile||{}),displayName:e.target.value}}:x))}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                    <input
                      className="input"
                      placeholder="Phone"
                      value={a.profile?.phone || ''}
                      onChange={e=>setAgents(prev=>prev.map(x=>x.email===a.email?{...x,profile:{...(x.profile||{}),phone:e.target.value}}:x))}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                    <input
                      className="input"
                      placeholder="Agency"
                      value={a.profile?.agency || ''}
                      onChange={e=>setAgents(prev=>prev.map(x=>x.email===a.email?{...x,profile:{...(x.profile||{}),agency:e.target.value}}:x))}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Bio"
                      value={a.profile?.bio || ''}
                      onChange={e=>setAgents(prev=>prev.map(x=>x.email===a.email?{...x,profile:{...(x.profile||{}),bio:e.target.value}}:x))}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                    />

                    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                      <button
                        className="btn btn-primary"
                        disabled={savingEmail === a.email}
                        onClick={async ()=>{
                          setSavingEmail(a.email)
                          setError(null)
                          try{
                            const res = await fetch('/api/admin/agents', {
                              method:'POST',
                              headers:{'Content-Type':'application/json'},
                              body: JSON.stringify({ email: a.email, profile: a.profile || {} })
                            })
                            const data = await res.json().catch(()=>({}))
                            if(!res.ok) throw new Error(data?.error || 'Failed to save')
                            await load()
                          }catch(e){
                            setError(e.message || 'Failed to save')
                          }finally{
                            setSavingEmail(null)
                          }
                        }}
                      >
                        {savingEmail === a.email ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {!loading && agents.length === 0 ? (
              <div className="small">No agent profiles found yet.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
