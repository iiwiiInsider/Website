import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'

export default function AgentProfileEditor({ showHeader = true }){
  const { data: session, status } = useSession()
  const [form, setForm] = useState({
    displayName: '',
    agentEmail: '',
    phone: '',
    agency: '',
    bio: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(()=>{
    if(status !== 'authenticated') return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/agent/profile')
      .then(r=>r.json())
      .then(d=>{
        if(cancelled) return
        if(d?.error){ setError(d.error); return }
        setForm({
          displayName: d?.profile?.displayName || session?.user?.name || '',
          agentEmail: d?.profile?.agentEmail || session?.user?.email || '',
          phone: d?.profile?.phone || '',
          agency: d?.profile?.agency || '',
          bio: d?.profile?.bio || ''
        })
      })
      .catch(()=>{ if(!cancelled) setError('Failed to load profile') })
      .finally(()=>{ if(!cancelled) setLoading(false) })
    return ()=>{ cancelled = true }
  },[status, session?.user?.name])

  if(status === 'loading'){
    return <div className="card">Loading…</div>
  }

  if(status !== 'authenticated'){
    return (
      <div className="card">
        <h3 style={{marginTop:0}}>Agent Profile</h3>
        <div className="small" style={{marginBottom:12}}>Sign in to update your agent profile.</div>
        <button className="btn btn-primary" onClick={()=>signIn()}>Sign In</button>
      </div>
    )
  }

  const email = session?.user?.email || ''

  return (
    <div className="card">
      {showHeader ? (
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <h2 style={{marginTop:0}}>Agent Profile</h2>
          <div className="small">Signed in as <strong>{email}</strong></div>
        </div>
      ) : null}

      {error && <div className="small" style={{color:'#b91c1c',marginTop: showHeader ? 8 : 0}}>{error}</div>}
      {saved && <div className="small" style={{color:'#065f46',marginTop: showHeader ? 8 : 0}}>Saved</div>}

      <div style={{marginTop:12}}>
        <label className="small" htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          className="input"
          value={form.displayName}
          onChange={e=>{ setSaved(false); setForm(f=>({...f, displayName: e.target.value})) }}
          placeholder="e.g. Kyle Blackburn"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />

        <label className="small" htmlFor="agentEmail" style={{display:'block',marginTop:10}}>Agent email</label>
        <input
          id="agentEmail"
          className="input"
          value={form.agentEmail}
          onChange={e=>{ setSaved(false); setForm(f=>({...f, agentEmail: e.target.value})) }}
          placeholder="e.g. agent@yourbusiness.com"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />

        <label className="small" htmlFor="phone" style={{display:'block',marginTop:10}}>Phone</label>
        <input
          id="phone"
          className="input"
          value={form.phone}
          onChange={e=>{ setSaved(false); setForm(f=>({...f, phone: e.target.value})) }}
          placeholder="e.g. +27 00 000 0000"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />

        <label className="small" htmlFor="agency" style={{display:'block',marginTop:10}}>Agency</label>
        <input
          id="agency"
          className="input"
          value={form.agency}
          onChange={e=>{ setSaved(false); setForm(f=>({...f, agency: e.target.value})) }}
          placeholder="e.g. Cape Town Realty"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />

        <label className="small" htmlFor="bio" style={{display:'block',marginTop:10}}>Bio</label>
        <textarea
          id="bio"
          className="input"
          rows={4}
          value={form.bio}
          onChange={e=>{ setSaved(false); setForm(f=>({...f, bio: e.target.value})) }}
          placeholder="Short description for clients…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />

        <div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap'}}>
          <button
            className="btn btn-primary"
            disabled={loading || saving}
            onClick={async ()=>{
              setError(null)
              setSaved(false)
              setSaving(true)
              try{
                const res = await fetch('/api/agent/profile', {
                  method: 'POST',
                  headers: {'Content-Type':'application/json'},
                  body: JSON.stringify(form)
                })
                const data = await res.json().catch(()=>({}))
                if(!res.ok){
                  setError(data?.error || 'Failed to save')
                  return
                }
                setSaved(true)
              }catch{
                setError('Failed to save')
              }finally{
                setSaving(false)
              }
            }}
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
          <button
            className="btn btn-outline"
            disabled={saving}
            onClick={()=>{
              setSaved(false)
              setError(null)
              setForm({ displayName:'', agentEmail:'', phone:'', agency:'', bio:'' })
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
