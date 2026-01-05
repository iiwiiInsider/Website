import '../styles/globals.css'
import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { WebcamProvider } from '../components/WebcamContext'
import WebcamRequiredGate from '../components/WebcamRequiredGate'

function SessionTracker(){
  const { data: session, status } = useSession()

  useEffect(()=>{
    if(status === 'authenticated' && session?.user?.email){
      const key = 'lastTrackedEmail'
      const last = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      if(last === session.user.email) return // already tracked this session in this browser
      (async ()=>{
        try{
          const payload = {
            loggedIn: true,
            email: session.user.email,
            userId: session.user.id || null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            platform: typeof navigator !== 'undefined' ? navigator.platform : null,
            screen: typeof screen !== 'undefined' ? {width: screen.width, height: screen.height} : null,
            innerSize: typeof window !== 'undefined' ? {w: window.innerWidth, h: window.innerHeight} : null,
            language: typeof navigator !== 'undefined' ? navigator.language : null,
            timestamp: new Date().toISOString(),
            source: 'session-detect'
          }
          await fetch('/api/tracking/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) }).catch(()=>null)
          try{ window.localStorage.setItem(key, session.user.email) }catch(e){}
        }catch(e){ console.error('Session tracking failed', e) }
      })()
    }
  },[status, session])

  return null
}

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

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <WebcamProvider>
        <BackgroundPointerTracker />
        <SessionTracker />
        <WebcamRequiredGate>
          <Component {...pageProps} />
        </WebcamRequiredGate>
      </WebcamProvider>
    </SessionProvider>
  )
}
