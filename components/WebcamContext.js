import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const WebcamContext = createContext(null)

function isStreamActive(stream){
  if(!stream) return false
  try{
    const tracks = typeof stream.getVideoTracks === 'function' ? stream.getVideoTracks() : []
    return tracks.some(t => t && t.readyState === 'live' && t.enabled)
  }catch(e){
    return false
  }
}

export function WebcamProvider({ children }){
  const [status, setStatus] = useState('idle')
  const [stream, setStream] = useState(null)
  const [lastErrorName, setLastErrorName] = useState('')
  const streamRef = useRef(null)

  const stopCamera = useCallback(()=>{
    const current = streamRef.current
    if(current){
      try{
        for(const track of current.getTracks()) track.stop()
      }catch(e){}
    }
    streamRef.current = null
    setStream(null)
  },[])

  const requestCamera = useCallback(async ()=>{
    if(typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia){
      setStatus('unavailable')
      return
    }

    setLastErrorName('')
    stopCamera()
    setStatus('requesting')

    try{
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })

      // If the track ends (user toggles camera off, device unplugged), drop back to idle.
      try{
        const track = nextStream.getVideoTracks?.()[0]
        if(track){
          track.addEventListener('ended', ()=>{
            setStream(null)
            setStatus('idle')
          }, { once: true })
        }
      }catch(e){}

      streamRef.current = nextStream
      setStream(nextStream)
      setStatus('ready')
    }catch(e){
      const name = e?.name || ''
      setLastErrorName(name)
      if(name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError'){
        setStatus('denied')
      }else if(name === 'NotFoundError' || name === 'OverconstrainedError'){
        setStatus('unavailable')
      }else{
        setStatus('error')
      }
    }
  },[stopCamera])

  // On mount: do NOT auto-trigger the permission prompt.
  // If permission is already granted, we can start immediately.
  useEffect(()=>{
    let cancelled = false

    if(typeof navigator === 'undefined') return undefined
    if(!navigator.mediaDevices?.getUserMedia){
      setStatus('unavailable')
      return undefined
    }

    ;(async ()=>{
      try{
        if(!navigator.permissions?.query) return
        const perm = await navigator.permissions.query({ name: 'camera' })
        if(cancelled) return
        if(perm?.state === 'granted'){
          requestCamera()
        }
      }catch(e){
        // Permissions API not supported or camera permission name unsupported.
      }
    })()

    return () => {
      cancelled = true
      stopCamera()
    }
  },[requestCamera, stopCamera])

  const value = useMemo(()=>{
    return {
      status,
      stream,
      isActive: isStreamActive(stream),
      lastErrorName,
      requestCamera,
      stopCamera,
    }
  },[status, stream, lastErrorName, requestCamera, stopCamera])

  return <WebcamContext.Provider value={value}>{children}</WebcamContext.Provider>
}

export function useWebcam(){
  const ctx = useContext(WebcamContext)
  if(!ctx) throw new Error('useWebcam must be used within a WebcamProvider')
  return ctx
}
