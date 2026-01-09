import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Navbar from '../components/Navbar'
import { USER_TOOLS, TOOL_DESCRIPTIONS } from '../lib/userSettings'

export default function UserSettings() {
  const { data: session, status } = useSession() ?? {}
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  const [primaryTool, setPrimaryTool] = useState(USER_TOOLS.BUYER)
  const [selectedTools, setSelectedTools] = useState([USER_TOOLS.BUYER])
  const [currency, setCurrency] = useState('ZAR')
  const [newsletterOptIn, setNewsletterOptIn] = useState(true)

  const [paymentMethods, setPaymentMethods] = useState([])
  const [newPayment, setNewPayment] = useState({
    cardholder: '',
    brand: 'Visa',
    last4: '',
    exp: ''
  })
  
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [deleteCode, setDeleteCode] = useState('')
  const [deleteRequested, setDeleteRequested] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [twoFASetup, setTwoFASetup] = useState(null)
  const [twoFACode, setTwoFACode] = useState('')
  const [enablingTwoFA, setEnablingTwoFA] = useState(false)
  const [twoFAError, setTwoFAError] = useState(null)
  const [twoFASuccess, setTwoFASuccess] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false)
      return
    }

    const loadSettings = async () => {
      try {
        const res = await fetch('/api/user/settings')
        const data = await res.json()
        if (res.ok && data.settings) {
          setSettings(data.settings)
          // Force role from session if available; remove tool selection UI
          const sessionRole = String(session?.user?.role || '').toLowerCase()
          if(sessionRole && Object.values(USER_TOOLS).includes(sessionRole)){
            setPrimaryTool(sessionRole)
            setSelectedTools([sessionRole])
          }else{
            setPrimaryTool(data.settings.primaryTool)
            setSelectedTools(data.settings.tools)
          }
          setCurrency(data.settings.preferences.currency)
          setNewsletterOptIn(data.settings.preferences?.newsletterOptIn !== false)
        }
      } catch (e) {
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [status])

  const toggleTool = () => {}

  const addPaymentMethod = () => {
    const trimmedLast4 = String(newPayment.last4 || '').replace(/\D/g,'').slice(-4)
    const exp = String(newPayment.exp || '').trim()
    if(!newPayment.cardholder.trim() || trimmedLast4.length !== 4 || !exp){
      setError('Enter cardholder, last 4 digits, and expiry (MM/YY)')
      return
    }
    const entry = {
      id: `pm_${Date.now()}`,
      cardholder: newPayment.cardholder.trim(),
      brand: newPayment.brand,
      last4: trimmedLast4,
      exp
    }
    setPaymentMethods(prev => [entry, ...prev])
    setNewPayment({ cardholder: '', brand: 'Visa', last4: '', exp: '' })
    setError(null)
  }

  const removePaymentMethod = (id) => {
    setPaymentMethods(prev => prev.filter(p => p.id !== id))
  }

  const handleSave = async () => {
    if (selectedTools.length === 0) {
      setError('Please select at least one tool')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryTool,
          tools: selectedTools,
          preferences: {
            currency,
            newsletterOptIn
          }
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')

      setSettings(data.settings)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Loading settings…</h3>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Sign in required</h3>
            <a href="/login" className="btn btn-primary">Sign In</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <main className="container">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Account Settings</h2>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626',
              padding: 12,
              borderRadius: 6,
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#16a34a',
              padding: 12,
              borderRadius: 6,
              marginBottom: 16
            }}>
              ✓ Settings saved successfully!
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Payment Methods</h3>
            <p className="small" style={{ marginTop: 0, marginBottom: 16, opacity: 0.8 }}>
              Store your preferred payment methods for faster checkout.
            </p>

            {/* Saved Payment Methods */}
            {paymentMethods.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 700, 
                  marginBottom: 10, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  opacity: 0.7
                }}>
                  Saved Cards ({paymentMethods.length})
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {paymentMethods.map(pm => (
                    <div 
                      key={pm.id} 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.5)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {pm.brand} •••• {pm.last4}
                        </div>
                        <div className="small" style={{ opacity: 0.75 }}>
                          Exp {pm.exp} • {pm.cardholder}
                        </div>
                      </div>
                      <button 
                        className="btn btn-ghost" 
                        type="button" 
                        onClick={() => removePaymentMethod(pm.id)}
                        style={{ fontSize: 13, padding: '6px 12px' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Payment Method */}
            <div>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                opacity: 0.7
              }}>
                Add New Card
              </div>
              
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Cardholder Name
                  </label>
                  <input
                    className="input"
                    placeholder="John Doe"
                    value={newPayment.cardholder}
                    onChange={e => setNewPayment(n => ({ ...n, cardholder: e.target.value }))}
                    style={{ width: '100%', marginTop: 0 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                      Card Brand
                    </label>
                    <select
                      className="input"
                      value={newPayment.brand}
                      onChange={e => setNewPayment(n => ({ ...n, brand: e.target.value }))}
                      style={{ width: '100%', marginTop: 0 }}
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Amex">American Express</option>
                      <option value="Discover">Discover</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                      Last 4 Digits
                    </label>
                    <input
                      className="input"
                      placeholder="1234"
                      maxLength={4}
                      value={newPayment.last4}
                      onChange={e => setNewPayment(n => ({ ...n, last4: e.target.value.replace(/\D/g, '') }))}
                      style={{ width: '100%', marginTop: 0 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                    Expiry Date
                  </label>
                  <input
                    className="input"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={newPayment.exp}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '')
                      if (val.length >= 2) {
                        val = val.slice(0, 2) + '/' + val.slice(2, 4)
                      }
                      setNewPayment(n => ({ ...n, exp: val }))
                    }}
                    style={{ width: '100%', marginTop: 0 }}
                  />
                </div>

                <button 
                  className="btn btn-outline" 
                  type="button" 
                  onClick={addPaymentMethod}
                  style={{ fontSize: 14, padding: '8px 16px' }}
                >
                  Add Payment Method
                </button>
              </div>

              {paymentMethods.length === 0 && (
                <div className="small" style={{ marginTop: 12, opacity: 0.75, textAlign: 'center' }}>
                  No saved payment methods yet.
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>Two-Factor Authentication</h3>
            <p className="small" style={{ marginTop: 0, marginBottom: 12, opacity: 0.82 }}>
              Secure your account with two-factor authentication using Google Authenticator or Authy.
            </p>
            {twoFASuccess && (
              <div className="small" style={{ color: '#16a34a', marginBottom: 10 }}>✓ Two-factor authentication enabled!</div>
            )}
            {twoFAError && (
              <div className="small" style={{ color: '#b91c1c', marginBottom: 10 }}>{twoFAError}</div>
            )}
            
            {!twoFASetup && settings?.twoFAEnabled ? (
              <div style={{padding:12,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:8,marginBottom:12}}>
                <p className="small" style={{margin:0,color:'#16a34a'}}>✓ Two-factor authentication is active</p>
              </div>
            ) : null}
            
            {!twoFASetup && !settings?.twoFAEnabled ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={async () => {
                  setTwoFAError(null)
                  setTwoFASuccess(false)
                  try{
                    const res = await fetch('/api/user/2fa-setup', { method: 'POST' })
                    const data = await res.json()
                    if(!res.ok) throw new Error(data.error || 'Failed to setup 2FA')
                    setTwoFASetup(data)
                  }catch(e){
                    setTwoFAError(e.message)
                  }
                }}
                style={{ fontSize: 14, padding: '10px 16px' }}
              >
                Start Setup
              </button>
            ) : null}
            
            {twoFASetup ? (
              <div style={{display:'grid',gap:12}}>
                <div>
                  <label className="small" style={{display:'block',marginBottom:6}}>Scan with Google Authenticator or Authy</label>
                  <img src={twoFASetup.qrCode} alt="2FA QR Code" style={{maxWidth:'100%',borderRadius:8}} />
                </div>
                <div>
                  <label className="small" style={{display:'block',marginBottom:6}}>Or enter this key manually:</label>
                  <code style={{display:'block',padding:8,background:'rgba(0,0,0,0.2)',borderRadius:4,fontFamily:'monospace',marginBottom:12,wordBreak:'break-all'}}>
                    {twoFASetup.secret}
                  </code>
                </div>
                <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter 6-digit code"
                    value={twoFACode}
                    onChange={(e)=>setTwoFACode(e.target.value.replace(/\D/g,'').slice(0,6))}
                    style={{minWidth:120,flex:1}}
                  />
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={async () => {
                      setTwoFAError(null)
                      const code = String(twoFACode || '').trim()
                      if(!/^\d{6}$/.test(code)){
                        setTwoFAError('Enter a 6-digit code')
                        return
                      }
                      setEnablingTwoFA(true)
                      try{
                        const res = await fetch('/api/user/2fa-verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ secret: twoFASetup.secret, code })
                        })
                        const data = await res.json()
                        if(!res.ok) throw new Error(data.error || 'Verification failed')
                        setTwoFASuccess(true)
                        setTwoFASetup(null)
                        setTwoFACode('')
                        setTimeout(() => setTwoFASuccess(false), 3000)
                        // Reload settings
                        const settingsRes = await fetch('/api/user/settings')
                        const settingsData = await settingsRes.json()
                        if(settingsRes.ok) setSettings(settingsData.settings)
                      }catch(e){
                        setTwoFAError(e.message)
                      }finally{
                        setEnablingTwoFA(false)
                      }
                    }}
                    disabled={enablingTwoFA || !/^\d{6}$/.test(String(twoFACode || ''))}
                    style={{ fontSize: 14, padding: '10px 16px' }}
                  >
                    {enablingTwoFA ? 'Enabling…' : 'Enable 2FA'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setTwoFASetup(null)}
                    style={{ fontSize: 14, padding: '10px 16px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Role Display (read-only) */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Your Role</h3>
            <div style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: 'rgba(79, 70, 229, 0.06)',
              fontWeight: 700
            }}>
              {TOOL_DESCRIPTIONS[primaryTool]?.label || primaryTool}
            </div>
            <div className="small" style={{ opacity: 0.8, marginTop: 8 }}>
              Role is set during sign up/sign in and cannot be changed here.
            </div>
          </div>

          {/* Preferences Section */}
          <div style={{
            paddingTop: 24,
            borderTop: '1px solid #e5e7eb',
            marginBottom: 32
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Preferences</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input"
                style={{
                  width: '100%',
                  marginTop: 0
                }}
              >
                <option value="ZAR">South African Rand (R)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={(e) => setNewsletterOptIn(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 600 }}>Send me news and updates to my inbox</span>
              </label>
              <div className="small" style={{ opacity: 0.75, marginTop: 6, marginLeft: 28 }}>
                Uncheck to unsubscribe from newsletters and promotional emails
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div style={{
            paddingTop: 24,
            borderTop: '1px solid #e5e7eb',
            marginBottom: 32
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Security</h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Change Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="New email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{ width: '100%', marginTop: 0, marginBottom: 8 }}
              />
              <button
                className="btn btn-outline"
                onClick={async () => {
                  if (!newEmail) return
                  setChangingEmail(true)
                  setError(null)
                  try {
                    const res = await fetch('/api/user/change-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ newEmail })
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Failed to change email')
                    setSuccess(true)
                    setNewEmail('')
                    setTimeout(() => setSuccess(false), 3000)
                  } catch (e) {
                    setError(e.message)
                  } finally {
                    setChangingEmail(false)
                  }
                }}
                disabled={changingEmail || !newEmail}
                style={{ fontSize: 14, padding: '8px 16px' }}
              >
                {changingEmail ? 'Updating...' : 'Update Email'}
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Change Password
              </label>
              <input
                type="password"
                className="input"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                style={{ width: '100%', marginTop: 0, marginBottom: 8 }}
              />
              <input
                type="password"
                className="input"
                placeholder="New password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                style={{ width: '100%', marginTop: 0, marginBottom: 8 }}
              />
              <input
                type="password"
                className="input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                style={{ width: '100%', marginTop: 0, marginBottom: 8 }}
              />
              <button
                className="btn btn-outline"
                onClick={async () => {
                  if (!currentPassword || !newPassword || !confirmPassword) {
                    setError('Please fill all password fields')
                    return
                  }
                  if (newPassword !== confirmPassword) {
                    setError('New passwords do not match')
                    return
                  }
                  if (newPassword.length < 8) {
                    setError('Password must be at least 8 characters')
                    return
                  }
                  setChangingPassword(true)
                  setError(null)
                  try {
                    const res = await fetch('/api/user/change-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ currentPassword, newPassword })
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Failed to change password')
                    setSuccess(true)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setTimeout(() => setSuccess(false), 3000)
                  } catch (e) {
                    setError(e.message)
                  } finally {
                    setChangingPassword(false)
                  }
                }}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                style={{ fontSize: 14, padding: '8px 16px' }}
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* Delete Account */}
          <div style={{
            paddingTop: 24,
            borderTop: '1px solid #e5e7eb',
            marginBottom: 32
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, color: '#dc2626' }}>Delete Account</h3>
            <p className="small" style={{ marginTop: 0, marginBottom: 12, opacity: 0.8 }}>
              Request a one-time code to confirm deletion. Enter the code to permanently remove your profile.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline"
                type="button"
                onClick={async () => {
                  setError(null)
                  setSuccess(false)
                  setDeleting(true)
                  try {
                    const res = await fetch('/api/user/delete-request', { method: 'POST' })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Failed to send code')
                    setDeleteRequested(true)
                    setSuccess(true)
                    setTimeout(() => setSuccess(false), 3000)
                  } catch (e) {
                    setError(e.message)
                  } finally {
                    setDeleting(false)
                  }
                }}
                disabled={deleting}
                style={{ fontSize: 14, padding: '8px 16px' }}
              >
                {deleting ? 'Sending...' : 'Send deletion code'}
              </button>

              <input
                type="text"
                className="input"
                placeholder="Enter 6-digit code"
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value)}
                style={{ flex: 1, minWidth: 180, marginTop: 0 }}
              />

              <button
                className="btn btn-danger"
                type="button"
                onClick={async () => {
                  if(!deleteCode){
                    setError('Enter the code sent to your email')
                    return
                  }
                  setDeleting(true)
                  setError(null)
                  setSuccess(false)
                  try {
                    const res = await fetch('/api/user/delete-confirm', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: deleteCode })
                    })
                    const data = await res.json()
                    if(!res.ok) throw new Error(data.error || 'Failed to delete account')
                    setSuccess(true)
                    setDeleteCode('')
                    // Sign out and redirect after deletion
                    setTimeout(async () => {
                      await signOut({ redirect: false })
                      window.location.href = '/'
                    }, 1000)
                  } catch (e) {
                    setError(e.message)
                  } finally {
                    setDeleting(false)
                  }
                }}
                disabled={deleting || !deleteRequested}
                style={{ fontSize: 14, padding: '8px 16px' }}
              >
                {deleting ? 'Deleting...' : 'Confirm delete'}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1 }}
            >
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
            <a href="/market" className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>
              Back to Market
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
