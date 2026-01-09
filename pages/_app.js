import '../styles/globals.css'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { SessionProvider, useSession } from 'next-auth/react'

function BackgroundPointerTracker(){
  useEffect(()=>{
    if(typeof window === 'undefined') return
    const root = document.documentElement
    let rafId = 0

    const setVars = (x, y) => {
      root.style.setProperty('--mx', `${x}px`)
      root.style.setProperty('--my', `${y}px`)
    }

    // Sensible defaults on first paint.
    setVars(Math.round(window.innerWidth * 0.5), Math.round(window.innerHeight * 0.25))

    const onMove = (event) => {
      const point = event?.touches?.[0] || event
      if(!point) return
      const x = point.clientX
      const y = point.clientY
      if(typeof x !== 'number' || typeof y !== 'number') return

      if(rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(()=> setVars(x, y))
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })

    return () => {
      if(rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
    }
  },[])

  return null
}

function PromoOverlay(){
  const { data: session } = useSession() ?? {}
  const [visible, setVisible] = useState(false)

  useEffect(()=>{
    if(!session?.user?.email) return
    try{
      const dismissed = localStorage.getItem('promoDismissed')
      if(!dismissed) setVisible(true)
    }catch{}
  },[session?.user?.email])

  if(!visible || !session?.user?.email) return null

  return (
    <div style={{
      position:'fixed',
      right:16,
      bottom:16,
      zIndex:1200,
      maxWidth:320,
      padding:16,
      borderRadius:14,
      border:'1px solid rgba(255,255,255,0.12)',
      background:'rgba(12,18,32,0.9)',
      boxShadow:'0 18px 40px rgba(0,0,0,0.35)',
      color:'#e5e7ff',
      backdropFilter:'blur(6px)'
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
        <div style={{fontSize:13,letterSpacing:0.2,opacity:0.85,textTransform:'uppercase'}}>Promo</div>
        <button
          onClick={()=>{ setVisible(false); try{ localStorage.setItem('promoDismissed','1') }catch{} }}
          aria-label="Close promotion"
          style={{background:'none',border:'none',color:'#cbd5e1',cursor:'pointer',fontSize:16,lineHeight:1}}
        >×</button>
      </div>
      <div style={{marginTop:8,fontWeight:700,fontSize:16}}>Limited-time offers</div>
      <div style={{marginTop:6,fontSize:13,opacity:0.9}}>Check out today’s specials and claim perks before they expire.</div>
      <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
        <a href="/market" style={{
          padding:'8px 12px',
          borderRadius:10,
          background:'linear-gradient(135deg,#a855f7 0%, #7c3aed 100%)',
          color:'#fff',
          textDecoration:'none',
          fontWeight:600,
          boxShadow:'0 10px 24px rgba(124,58,237,0.35)'
        }}>View offers</a>
        <button
          onClick={()=>{ setVisible(false); try{ localStorage.setItem('promoDismissed','1') }catch{} }}
          style={{
            padding:'8px 12px',
            borderRadius:10,
            border:'1px solid rgba(255,255,255,0.16)',
            background:'rgba(255,255,255,0.06)',
            color:'#e5e7ff',
            cursor:'pointer'
          }}
        >Dismiss</button>
      </div>
    </div>
  )
}

function ChatbotOverlay(){
  const { data: session } = useSession() ?? {}
  const [open, setOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi there! I can help you find listings, explain features, or guide you to support. Try asking: “How do I checkout?” or “Where are new arrivals?”' }
  ])

  useEffect(()=>{
    if(!session?.user?.email) return
    try{
      const seen = localStorage.getItem('aiChatbotSeen')
      if(!seen){
        setShowIntro(true)
      }
    }catch{}
  },[session?.user?.email])

  useEffect(()=>{
    if(!session?.user?.email) return
    const onContext = (e)=>{
      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener('contextmenu', onContext)
    return () => window.removeEventListener('contextmenu', onContext)
  },[session?.user?.email])

  if(!session?.user?.email) return null

  return (
    <>
      {showIntro && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'grid',placeItems:'center',zIndex:1400}}>
          <div style={{maxWidth:520,width:'90%',background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,boxShadow:'0 24px 60px rgba(0,0,0,0.45)',padding:24,color:'#e5e7ff'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{margin:0}}>AI Helper</h3>
              <button
                onClick={()=>{ setShowIntro(false); try{ localStorage.setItem('aiChatbotSeen','1') }catch{} }}
                style={{background:'none',border:'none',color:'#cbd5e1',fontSize:18,cursor:'pointer'}}
                aria-label="Close intro"
              >×</button>
            </div>
            <p style={{marginTop:12,marginBottom:16,lineHeight:1.6}}>Right-click anywhere to open the AI chatbot for quick help around the site. You can ask for navigation tips or product guidance.</p>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button
                onClick={()=>{ setShowIntro(false); setOpen(true); try{ localStorage.setItem('aiChatbotSeen','1') }catch{} }}
                style={{padding:'10px 14px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#a855f7 0%, #7c3aed 100%)',color:'#fff',cursor:'pointer',fontWeight:600}}
              >Open chatbot</button>
              <button
                onClick={()=>{ setShowIntro(false); try{ localStorage.setItem('aiChatbotSeen','1') }catch{} }}
                style={{padding:'10px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.14)',background:'rgba(255,255,255,0.05)',color:'#e5e7ff',cursor:'pointer'}}
              >Got it</button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div style={{
          position:'fixed',
          right:16,
          bottom:16,
          width:360,
          maxWidth:'calc(100vw - 32px)',
          background:'#0b1220',
          border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:14,
          boxShadow:'0 18px 40px rgba(0,0,0,0.35)',
          zIndex:1300,
          color:'#e5e7ff',
          overflow:'hidden'
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',background:'rgba(255,255,255,0.04)'}}>
            <div style={{fontWeight:700}}>AI Chatbot</div>
            <button
              onClick={()=>setOpen(false)}
              aria-label="Close chatbot"
              style={{background:'none',border:'none',color:'#cbd5e1',cursor:'pointer',fontSize:16}}
            >×</button>
          </div>
          <div style={{padding:'14px',display:'grid',gap:10}}>
            <div style={{fontSize:13,opacity:0.9}}>Ask for help navigating the marketplace, finding listings, or account tips.</div>
            <div style={{maxHeight:220,overflowY:'auto',display:'grid',gap:8,border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:10,background:'rgba(255,255,255,0.02)'}}>
              {messages.map((m, idx) => (
                <div key={idx} style={{
                  alignSelf: m.from === 'user' ? 'end' : 'start',
                  maxWidth:'90%',
                  padding:'8px 10px',
                  borderRadius:10,
                  background: m.from === 'user' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  color:'#e5e7ff',
                  fontSize:13
                }}>
                  {m.text}
                </div>
              ))}
            </div>
            <textarea
              value={input}
              onChange={e=>setInput(e.target.value)}
              placeholder="Type your question..."
              style={{width:'100%',minHeight:70,borderRadius:10,border:'1px solid rgba(255,255,255,0.14)',background:'rgba(255,255,255,0.04)',color:'#e5e7ff',padding:10,fontFamily:'inherit'}}
            />
            <button
              onClick={()=>{
                const text = input.trim()
                if(!text) return
                const canned = 'Here are quick pointers: use Market to browse, filters to narrow results, and Cart to checkout. Need more? Try About or Contact.'
                setMessages(prev => [...prev, { from:'user', text }, { from:'bot', text: canned }])
                setInput('')
              }}
              style={{
                padding:'10px 12px',
                borderRadius:10,
                border:'none',
                background:'linear-gradient(135deg,#a855f7 0%, #7c3aed 100%)',
                color:'#fff',
                fontWeight:700,
                cursor:'pointer'
              }}
            >Send</button>
          </div>
        </div>
      )}
    </>
  )
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SessionProvider session={pageProps?.session}>
        <BackgroundPointerTracker />
        <PromoOverlay />
        <ChatbotOverlay />
        <Component {...pageProps} />
      </SessionProvider>
    </>
  )
}
