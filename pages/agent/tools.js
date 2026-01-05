import { useSession, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import AgentProfileEditor from '../../components/AgentProfileEditor'
import { ALLOWED_NEIGHBORHOODS, normalizeNeighborhood } from '../../lib/neighborhoods'
import { currencyForTimeZone } from '../../lib/currency'

export default function AgentTools(){
  const { data: session, status } = useSession()

  const MAX_IMAGES = 15
  const MAX_IMAGE_BYTES = 1_000_000
  const [createForm, setCreateForm] = useState({
    listingType: 'buy',
    title: '',
    description: '',
    neighborhood: ALLOWED_NEIGHBORHOODS[0],
    city: 'Cape Town',
    price: '',
    currency: 'ZAR',
    imageDataUrls: []
  })
  const [createImageKey, setCreateImageKey] = useState(0)
  const [createError, setCreateError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createdId, setCreatedId] = useState(null)

  const [taskTimeZone, setTaskTimeZone] = useState('Africa/Johannesburg')
  const [taskForm, setTaskForm] = useState({
    title: 'Required: Contact client and follow up',
    priority: 'normal',
    dueDate: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    propertyId: '',
    listingTitle: '',
    instructions: '',
    notes: ''
  })
  const [tasks, setTasks] = useState([])
  const [taskBusy, setTaskBusy] = useState(false)
  const [taskError, setTaskError] = useState(null)

  useEffect(()=>{
    // Reuse the timezone preference already stored by the Market page.
    try{
      const savedTz = localStorage.getItem('displayTimeZone')
      if(savedTz) setTaskTimeZone(savedTz)
      const currency = currencyForTimeZone(savedTz)
      setCreateForm(f => ({ ...f, currency }))
    }catch{
      // ignore
    }
  },[])

  const loadTasks = async () => {
    try{
      const res = await fetch('/api/agent/tasks')
      const data = await res.json().catch(()=> ({}))
      if(res.ok) setTasks(Array.isArray(data?.tasks) ? data.tasks : [])
    }catch{
      // ignore
    }
  }

  useEffect(()=>{
    if(!session?.user?.email) return
    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[session?.user?.email])

  const downloadPdf = async (payload) => {
    const res = await fetch('/api/pdf/agent-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if(!res.ok){
      const data = await res.json().catch(()=> ({}))
      throw new Error(data?.error || 'Failed to generate PDF')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-task-${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const createRequiredTaskAndPdf = async () => {
    setTaskError(null)
    setTaskBusy(true)
    try{
      const fields = {
        clientName: String(taskForm.clientName || '').trim(),
        clientEmail: String(taskForm.clientEmail || '').trim(),
        clientPhone: String(taskForm.clientPhone || '').trim(),
        propertyId: String(taskForm.propertyId || '').trim(),
        listingTitle: String(taskForm.listingTitle || '').trim(),
        instructions: String(taskForm.instructions || '').trim(),
        notes: String(taskForm.notes || '').trim()
      }

      const taskPayload = {
        assignedToEmail: session?.user?.email,
        title: String(taskForm.title || '').trim(),
        priority: String(taskForm.priority || 'normal').trim(),
        dueDate: String(taskForm.dueDate || '').trim(),
        timeZone: taskTimeZone,
        fields
      }

      const res = await fetch('/api/agent/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload)
      })
      const data = await res.json().catch(()=> ({}))
      if(!res.ok) throw new Error(data?.error || 'Failed to create required task')

      await downloadPdf(taskPayload)
      await loadTasks()
    }catch(e){
      setTaskError(e.message || 'Failed to create task')
    }finally{
      setTaskBusy(false)
    }
  }

  const markDone = async (id) => {
    setTaskError(null)
    try{
      const res = await fetch('/api/agent/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'done' })
      })
      const data = await res.json().catch(()=> ({}))
      if(!res.ok) throw new Error(data?.error || 'Failed to mark done')
      setTasks(prev => prev.map(t => String(t.id) === String(id) ? (data.task || t) : t))
    }catch(e){
      setTaskError(e.message || 'Failed to mark done')
    }
  }

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || '') || '')
    reader.onerror = () => reject(new Error('read-failed'))
    reader.readAsDataURL(file)
  })

  const onPickImages = async (e) => {
    setCreateError(null)
    const files = Array.from(e.target.files || [])
    if(files.length === 0){
      setCreateForm(f => ({ ...f, imageDataUrls: [] }))
      return
    }
    if(files.length > MAX_IMAGES){
      setCreateError(`Maximum ${MAX_IMAGES} photos allowed`)
      setCreateForm(f => ({ ...f, imageDataUrls: [] }))
      setCreateImageKey(k=>k+1)
      return
    }

    for(const file of files){
      if(!/^image\/(png|jpeg|webp)$/.test(file.type)){
        setCreateError('Images must be PNG, JPG, or WEBP')
        setCreateForm(f => ({ ...f, imageDataUrls: [] }))
        setCreateImageKey(k=>k+1)
        return
      }
      if(file.size > MAX_IMAGE_BYTES){
        setCreateError('Each image must be 1MB or smaller')
        setCreateForm(f => ({ ...f, imageDataUrls: [] }))
        setCreateImageKey(k=>k+1)
        return
      }
    }

    try{
      const dataUrls = []
      for(const file of files){
        const dataUrl = await readFileAsDataUrl(file)
        if(dataUrl) dataUrls.push(dataUrl)
      }
      setCreateForm(f => ({ ...f, imageDataUrls: dataUrls.slice(0, MAX_IMAGES) }))
    }catch{
      setCreateError('Failed to read one or more images')
      setCreateForm(f => ({ ...f, imageDataUrls: [] }))
      setCreateImageKey(k=>k+1)
    }
  }

  const createListing = async () => {
    setCreateError(null)
    setCreatedId(null)
    const payload = {
      listingType: createForm.listingType,
      title: String(createForm.title || '').trim(),
      description: String(createForm.description || '').trim(),
      neighborhood: String(createForm.neighborhood || '').trim(),
      city: String(createForm.city || '').trim() || 'Cape Town',
      price: Number(createForm.price),
      currency: createForm.currency,
      imageDataUrls: Array.isArray(createForm.imageDataUrls) ? createForm.imageDataUrls.slice(0, MAX_IMAGES) : []
    }

    if(!payload.title || !payload.description || !payload.neighborhood || !payload.price){
      setCreateError('Please fill in title, description, neighborhood and price')
      return
    }
    if(payload.title.length > 60){
      setCreateError('Title must be 60 characters or less')
      return
    }
    if(payload.description.length > 250){
      setCreateError('Description must be 250 characters or less')
      return
    }
    if(!ALLOWED_NEIGHBORHOODS.includes(payload.neighborhood)){
      setCreateError('Neighborhood must be selected from the list')
      return
    }
    if(!Number.isFinite(payload.price) || payload.price <= 0){
      setCreateError('Valid price required')
      return
    }

    setCreating(true)
    try{
      const res = await fetch('/api/market/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(()=>({}))
      if(!res.ok) throw new Error(data?.error || 'Failed to upload to market')

      setCreatedId(data?.listing?.id || null)
      setCreateForm({ listingType:'buy', title:'', description:'', neighborhood: ALLOWED_NEIGHBORHOODS[0], city:'Cape Town', price:'', currency: createForm.currency, imageDataUrls: [] })
      setCreateImageKey(k=>k+1)
    }catch(e){
      setCreateError(e.message || 'Failed to upload to market')
    }finally{
      setCreating(false)
    }
  }

  if(status === 'loading'){
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Loading your session…</h3>
          </div>
        </div>
      </div>
    )
  }

  if(!session){
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Please sign in to view Agent Tools</h3>
            <button onClick={()=>signIn()} className="btn btn-primary">Sign In</button>
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
          <h2 style={{marginTop:0}}>Agent Tools</h2>
          <div className="small" style={{marginBottom:12}}>Manage your agent profile and tools.</div>
        </div>

        <div className="card">
          <h2 style={{marginTop:0}}>Agent Profile</h2>
          <div className="small" style={{marginBottom:12}}>Edit your agent profile here.</div>
          <AgentProfileEditor showHeader={false} />
        </div>

        <div className="card">
          <h2 style={{marginTop:0}}>Required Task PDF</h2>
          <div className="small" style={{marginBottom:12}}>
            Fill in the specialized fields, then generate a PDF and save it as a required task assigned to you.
          </div>

          {taskError ? <div className="small" style={{color:'#b91c1c',marginBottom:10}}>{taskError}</div> : null}

          <div style={{display:'grid',gap:8}}>
            <input
              className="input"
              placeholder="Task title"
              value={taskForm.title}
              onChange={e=>setTaskForm(f=>({...f, title: e.target.value.slice(0,80)}))}
              autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
            />

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <select className="input" value={taskForm.priority} onChange={e=>setTaskForm(f=>({...f, priority: e.target.value}))}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <input
                className="input"
                type="date"
                value={taskForm.dueDate}
                onChange={e=>setTaskForm(f=>({...f, dueDate: e.target.value}))}
                autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
              />
            </div>

            <div className="small" style={{opacity:0.85,marginTop:10}}>Client</div>
            <input className="input" placeholder="Client name" value={taskForm.clientName} onChange={e=>setTaskForm(f=>({...f, clientName: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
            <input className="input" placeholder="Client email" value={taskForm.clientEmail} onChange={e=>setTaskForm(f=>({...f, clientEmail: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
            <input className="input" placeholder="Client phone" value={taskForm.clientPhone} onChange={e=>setTaskForm(f=>({...f, clientPhone: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />

            <div className="small" style={{opacity:0.85,marginTop:10}}>Listing</div>
            <input className="input" placeholder="Property ID" value={taskForm.propertyId} onChange={e=>setTaskForm(f=>({...f, propertyId: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
            <input className="input" placeholder="Listing title" value={taskForm.listingTitle} onChange={e=>setTaskForm(f=>({...f, listingTitle: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />

            <textarea className="input" rows={4} placeholder="Instructions" value={taskForm.instructions} onChange={e=>setTaskForm(f=>({...f, instructions: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
            <textarea className="input" rows={3} placeholder="Notes" value={taskForm.notes} onChange={e=>setTaskForm(f=>({...f, notes: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />

            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button className="btn btn-primary" disabled={taskBusy} onClick={createRequiredTaskAndPdf}>
                {taskBusy ? 'Generating…' : 'Generate PDF + Save Required Task'}
              </button>
              <button
                className="btn btn-outline"
                disabled={taskBusy}
                onClick={()=>setTaskForm({
                  title: 'Required: Contact client and follow up',
                  priority: 'normal',
                  dueDate: '',
                  clientName: '',
                  clientEmail: '',
                  clientPhone: '',
                  propertyId: '',
                  listingTitle: '',
                  instructions: '',
                  notes: ''
                })}
              >Clear</button>
            </div>
          </div>

          <div style={{marginTop:16}}>
            <h3 style={{marginTop:0,marginBottom:6}}>Your Required Tasks</h3>
            <div className="small" style={{opacity:0.8,marginBottom:10}}>Saved tasks assigned to your account.</div>
            {tasks.length === 0 ? <div className="small" style={{opacity:0.75}}>No tasks yet.</div> : null}
            <div style={{display:'grid',gap:8}}>
              {tasks.slice(0,10).map(t => (
                <div key={t.id} style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center',padding:'10px 12px',border:'1px solid var(--border)',borderRadius:10}}>
                  <div>
                    <div style={{fontWeight:800}}>{t.title}</div>
                    <div className="small" style={{opacity:0.85}}>{t.status} • {t.priority} • {String(t.createdAt || '').slice(0,10)}</div>
                  </div>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    {t.status !== 'done' ? (
                      <button className="btn btn-outline" disabled={taskBusy} onClick={()=>markDone(t.id)}>Mark done</button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{marginTop:0}}>Upload to Market</h2>
          <div className="small" style={{marginBottom:12}}>Create a new market listing (visible in Market).</div>

          {createError ? <div className="small" style={{color:'#b91c1c',marginBottom:10}}>{createError}</div> : null}
          {createdId ? (
            <div className="small" style={{color:'#065f46',marginBottom:10}}>
              Uploaded listing <strong>{createdId}</strong>.
            </div>
          ) : null}

          <div style={{display:'grid',gap:8}}>
            <select className="input" value={createForm.listingType} onChange={e=>setCreateForm(f=>({...f, listingType: e.target.value}))}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>

            <input className="input" placeholder="Title (max 60 characters)" value={createForm.title} maxLength={60} onChange={e=>setCreateForm(f=>({...f, title: e.target.value.slice(0,60)}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
            <textarea className="input" rows={3} placeholder="Description (max 250 characters)" value={createForm.description} maxLength={250} onChange={e=>setCreateForm(f=>({...f, description: e.target.value.slice(0,250)}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />

            <div>
              <div className="small" style={{opacity:0.85,marginTop:10}}>Upload Photos (optional, PNG/JPG/WEBP, max 1MB each, up to 15)</div>
              <input
                key={createImageKey}
                className="input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={onPickImages}
              />
              <div className="small" style={{opacity:0.85,marginTop:8}}>
                Selected: <strong>{Array.isArray(createForm.imageDataUrls) ? createForm.imageDataUrls.length : 0}</strong> / {MAX_IMAGES}
              </div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}>
                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={creating}
                  onClick={()=>{ setCreateError(null); setCreateForm(f=>({...f, imageDataUrls: [] })); setCreateImageKey(k=>k+1) }}
                >Clear Photos</button>
              </div>
            </div>

            <select className="input" value={createForm.neighborhood} onChange={e=>setCreateForm(f=>({...f, neighborhood: e.target.value}))}>
              {ALLOWED_NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <input className="input" placeholder="City" value={createForm.city} onChange={e=>setCreateForm(f=>({...f, city: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
            <input className="input" placeholder={`Price (${createForm.currency})`} inputMode="numeric" type="number" min="1" step="1" value={createForm.price} onChange={e=>setCreateForm(f=>({...f, price: e.target.value}))} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />

            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button className="btn btn-primary" disabled={creating} onClick={createListing}>{creating ? 'Uploading…' : 'Upload to Market'}</button>
              <button className="btn btn-outline" disabled={creating} onClick={()=>{ setCreateError(null); setCreatedId(null); setCreateForm({ listingType:'buy', title:'', description:'', neighborhood: ALLOWED_NEIGHBORHOODS[0], city:'Cape Town', price:'', currency: createForm.currency, imageDataUrls: [] }); setCreateImageKey(k=>k+1) }}>Clear</button>
              <a className="btn btn-outline" href="/market" style={{display:'inline-flex',alignItems:'center'}}>Go to Market</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
