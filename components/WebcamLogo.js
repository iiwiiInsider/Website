import { useEffect, useRef } from 'react'
import { useWebcam } from './WebcamContext'

export default function WebcamLogo(){
  const videoRef = useRef(null)
  const { status, stream, isActive, requestCamera } = useWebcam()

  useEffect(()=>{
    const video = videoRef.current
    if(!video) return
    if(stream){
      video.srcObject = stream
      try{ video.play() }catch(e){}
    }else{
      video.srcObject = null
    }
  },[stream])

  const showButton = !isActive

  return (
    <div className={`logo small webcam-logo ${isActive ? 'is-ready' : ''}`.trim()} aria-label="Webcam logo">
      <video
        ref={videoRef}
        className="webcam-logo-video"
        muted
        playsInline
        autoPlay
      />

      {showButton ? (
        <button
          type="button"
          className="btn-ghost webcam-logo-btn"
          onClick={requestCamera}
          disabled={status === 'requesting'}
        >
          {status === 'requesting' ? 'Requesting…' : 'Enable camera'}
        </button>
      ) : null}
    </div>
  )
}
