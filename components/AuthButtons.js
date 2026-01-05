import { signIn } from 'next-auth/react'

function GoogleIcon(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M21.35 11.1H12v2.8h5.35c-.23 1.4-1.02 2.6-2.18 3.4v2.8h3.52C20.78 19.3 22 15.4 22 12c0-.8-.1-1.6-.3-2.3z" fill="#4285F4"/>
      <path d="M12 22c2.7 0 4.95-.9 6.6-2.4l-3.52-2.8c-.98.66-2.27 1.06-3.08 1.06-2.36 0-4.36-1.58-5.08-3.72H3.26v2.34C4.9 19.9 8.23 22 12 22z" fill="#34A853"/>
      <path d="M6.92 13.14A7.97 7.97 0 016.5 12c0-.36.04-.72.12-1.06V8.6H3.26A11.97 11.97 0 002 12c0 1.98.5 3.82 1.38 5.42l3.54-2.28z" fill="#FBBC05"/>
      <path d="M12 6.5c1.47 0 2.8.5 3.84 1.46l2.88-2.88C16.96 3.38 14.7 2.5 12 2.5 8.23 2.5 4.9 4.6 3.26 7.66l3.78 2.32C7.64 7.98 9.64 6.5 12 6.5z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M16.365 1.43c0 1.02-.39 2.01-1.09 2.78-.63.71-1.78 1.46-2.94 1.02-.03-.14-.06-.28-.06-.42 0-1.21.49-2.43 1.29-3.24.83-.84 2.12-1.35 2.8-1.14.12.04.21.08.24.18zM12.94 5.12c.4.01.86.12 1.3.35.8.36 1.54.55 2.02.68.25.07.44.14.62.21-1.35 1.48-1.63 3.11-1.43 4.62.21 1.66 1.04 3.01 1.04 3.01s-1.94 0-3.49-1.01c-1.74-1.13-2.83-1.72-4.5-1.72-1.38 0-3.8.67-3.8.67s.95-2.19 2.77-3.58c.86-.64 1.99-1.17 3.1-1.07.07.01.15.02.21.02 1.05 0 1.9-.51 2.65-.63z" fill="#111"/>
    </svg>
  )
}

export default function AuthButtons({ providers }){
  if(!providers) return null
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {Object.values(providers).map(p => (
        <button key={p.name} className="btn btn-provider" onClick={()=>{
          // Per request: show OAuth option but route to an error page (simulates unavailable external providers)
          if(p.name === 'Google' || p.name === 'Apple'){
            window.location.href = '/oauth-error'
            return
          }
          signIn(p.id)
        }}>
          {p.name === 'Google' ? <GoogleIcon /> : null}
          {p.name === 'Apple' ? <AppleIcon /> : null}
          <span style={{marginLeft:8}}>Sign in with {p.name}</span>
        </button>
      ))}
    </div>
  )
}
