import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Navbar from '../../components/Navbar'

export default function AgentOffers() {
  const { data: session, status } = useSession() ?? {}
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [drafts, setDrafts] = useState({})

  const loadOffers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/purchases?role=agent')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const list = Array.isArray(data.purchases) ? data.purchases : []
        setOffers(list)
        const map = {}
        list.forEach(p => {
          map[p.id] = {
            propertyAddress: p.propertyAddress || '',
            landTaxRate: p.landTaxRate ? String(p.landTaxRate) : '1.2',
            closingDate: p.closingDate || '',
            propertyDetails: p.propertyDetails || ''
          }
        })
        setDrafts(map)
      } else {
        setError(data.error || 'Failed to load offers')
      }
    } catch (e) {
      setError('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') loadOffers()
    if (status === 'unauthenticated') setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const updateDraft = (id, field, value) => {
    setDrafts(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }))
  }

  const takeAction = async (purchaseId, nextStatus) => {
    setError(null)
    setActionBusy(true)
    const draft = drafts[purchaseId] || {}

    if (nextStatus === 'accepted' && !draft.propertyAddress) {
      setError('Property address is required to accept an offer')
      setActionBusy(false)
      return
    }

    try {
      const res = await fetch('/api/user/purchases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId,
          status: nextStatus,
          propertyAddress: draft.propertyAddress,
          landTaxRate: draft.landTaxRate,
          propertyDetails: draft.propertyDetails,
          closingDate: draft.closingDate
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Update failed')
      await loadOffers()
    } catch (e) {
      setError(e.message || 'Update failed')
    } finally {
      setActionBusy(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Loading…</h3>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div>
        <Navbar />
        <div className="container center">
          <div className="card">
            <h3>Agent sign in required</h3>
            <button className="btn btn-primary" onClick={() => signIn()}>Sign In</button>
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
          <h2 style={{ marginTop: 0 }}>Offers on Your Listings</h2>
          <div className="small" style={{ marginBottom: 12 }}>
            Review offers made to your claimed listings. Add address and land tax, then accept.
          </div>

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

          {offers.length === 0 ? (
            <div className="small" style={{ opacity: 0.8 }}>No offers yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: 10, textAlign: 'left' }}>Property</th>
                    <th style={{ padding: 10, textAlign: 'left' }}>Buyer</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Asking</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Offer</th>
                    <th style={{ padding: 10, textAlign: 'left' }}>Address</th>
                    <th style={{ padding: 10, textAlign: 'center' }}>Land Tax %</th>
                    <th style={{ padding: 10, textAlign: 'center' }}>Closing</th>
                    <th style={{ padding: 10, textAlign: 'center' }}>Status</th>
                    <th style={{ padding: 10, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map(p => {
                    const draft = drafts[p.id] || {}
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 10, fontSize: 13 }}>
                          {p.propertyId}
                        </td>
                        <td style={{ padding: 10, fontSize: 13 }}>
                          {p.buyerEmail}
                        </td>
                        <td style={{ padding: 10, fontSize: 13, textAlign: 'right' }}>
                          R{Number(p.listingPrice || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: 10, fontSize: 13, textAlign: 'right', fontWeight: 700 }}>
                          R{Number(p.offeredPrice || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: 10, minWidth: 180 }}>
                          <input
                            className="input"
                            placeholder="123 Main St, City"
                            value={draft.propertyAddress || ''}
                            onChange={e => updateDraft(p.id, 'propertyAddress', e.target.value)}
                            style={{ minWidth: 160 }}
                          />
                          <textarea
                            className="input"
                            rows={2}
                            placeholder="Property details"
                            value={draft.propertyDetails || ''}
                            onChange={e => updateDraft(p.id, 'propertyDetails', e.target.value)}
                            style={{ marginTop: 6 }}
                          />
                        </td>
                        <td style={{ padding: 10, textAlign: 'center', minWidth: 90 }}>
                          <input
                            className="input"
                            type="number"
                            value={draft.landTaxRate || ''}
                            onChange={e => updateDraft(p.id, 'landTaxRate', e.target.value)}
                            style={{ width: 90 }}
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td style={{ padding: 10, textAlign: 'center' }}>
                          <input
                            className="input"
                            type="date"
                            value={draft.closingDate || ''}
                            onChange={e => updateDraft(p.id, 'closingDate', e.target.value)}
                            style={{ minWidth: 140 }}
                          />
                        </td>
                        <td style={{ padding: 10, textAlign: 'center', fontSize: 12 }}>
                          {p.status}
                        </td>
                        <td style={{ padding: 10, textAlign: 'center', minWidth: 160 }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {p.status === 'pending' ? (
                              <>
                                <button
                                  className="btn btn-primary"
                                  disabled={actionBusy}
                                  onClick={() => takeAction(p.id, 'accepted')}
                                >
                                  Accept + PDF
                                </button>
                                <button
                                  className="btn btn-outline"
                                  disabled={actionBusy}
                                  onClick={() => takeAction(p.id, 'rejected')}
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="small" style={{ opacity: 0.75 }}>{p.status}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
