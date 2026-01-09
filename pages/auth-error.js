import { useRouter } from 'next/router'
import Link from 'next/link'

export default function AuthErrorPage(){
  const router = useRouter()
  const { error, error_description } = router.query
  
  const errorMessages = {
    'OAuthSignin': 'Could not begin signing in with that provider',
    'OAuthCallback': 'Provider returned an error',
    'OAuthCreateAccount': 'Account creation failed',
    'EmailCreateAccount': 'Email account creation failed',
    'Callback': 'Callback handler returned error',
    'OAuthAccountNotLinked': 'Email already exists with another provider',
    'EmailSignInError': 'Email sign in failed',
    'CredentialsSignin': 'Sign in with credentials failed',
    'SessionCallback': 'Session callback error',
    'Verification': 'Verification token expired or invalid'
  }
  
  const message = errorMessages[error] || (error_description || 'An authentication error occurred')
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at 20% 20%, rgba(160,32,240,0.2), transparent 30%), radial-gradient(circle at 80% 0%, rgba(0,200,255,0.12), transparent 32%), #0b1220'
    }}>
      <div style={{
        maxWidth: 500,
        padding: 32,
        background: 'rgba(12,18,32,0.9)',
        border: '1px solid #1f2a44',
        borderRadius: 16,
        textAlign: 'center'
      }}>
        <div style={{fontSize: 48, marginBottom: 16}}>⚠️</div>
        <h1 style={{color: '#A020F0', margin: '0 0 12px'}}>Authentication Error</h1>
        <p style={{color: '#cbd5e1', margin: '0 0 8px'}}>
          {message}
        </p>
        {error && (
          <p style={{color: '#64748b', fontSize: 12, margin: '8px 0 0'}}>
            Error code: {error}
          </p>
        )}
        
        <div style={{marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center'}}>
          <Link href="/login">
            <button style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#A020F0',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}>
              Try Again
            </button>
          </Link>
          <Link href="/">
            <button style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #1f2a44',
              background: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}>
              Go Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
