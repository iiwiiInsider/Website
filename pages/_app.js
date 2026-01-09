import '../styles/globals.css'
import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'

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

export default function App({ Component, pageProps }) {
  return (
    <>
      <SessionProvider session={pageProps?.session}>
        <BackgroundPointerTracker />
        <Component {...pageProps} />
      </SessionProvider>
    </>
  )
}
