import { createContext } from 'react'

// Webcam features removed
const WebcamContext = createContext(null)
export function WebcamProvider({ children }){
  return children
}
export function useWebcam(){
  return { status: 'disabled', isActive: false, requestCamera: ()=>{}, stopCamera: ()=>{}, lastErrorName: '' }
}
