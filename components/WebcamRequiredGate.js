import { useEffect, useMemo, useState } from 'react'
import { useWebcam } from './WebcamContext'

function getMessage(status, lastErrorName){
  if(status === 'requesting') return 'Requesting camera permission…'
  if(status === 'denied') return 'Camera permission is required to use this site.'
  if(status === 'unavailable') return 'No camera was detected on this device.'
  if(status === 'error') return `Could not access the camera${lastErrorName ? ` (${lastErrorName})` : ''}.`
  return 'Click “Enable camera” to continue. Your browser will ask for access.'
}

export default function WebcamRequiredGate({ children }){
  const { status, isActive, lastErrorName, requestCamera } = useWebcam()
  const [mounted, setMounted] = useState(false)

  useEffect(()=>{ setMounted(true) },[])

  const message = useMemo(()=> getMessage(status, lastErrorName), [status, lastErrorName])

  // Avoid hydration flicker; don't render anything until client mount.
  if(!mounted) return null

  // Never render page contents unless the stream is actually live.
  if(isActive) return children

  return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="container center" style={{marginTop:0}}>
        <div className="card" style={{maxWidth:560}}>
          <h3 style={{marginTop:0}}>Enable your webcam</h3>
          <div className="small" style={{opacity:0.9, marginBottom:14}}>{message}</div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={requestCamera}
            disabled={status === 'requesting'}
          >
            {status === 'requesting' ? 'Requesting…' : 'Enable camera'}
          </button>
          <div className="small" style={{opacity:0.8, marginTop:12}}>
            If you previously blocked it, allow camera permission in your browser settings and retry.
          </div>
        </div>
      </div>
    </div>
  )
}
