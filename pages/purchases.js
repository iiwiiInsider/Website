import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '../components/Navbar'

export default function MyPurchases() {
  const { data: session, status } = useSession() ?? {}
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false)
      return
    }

    const loadPurchases = async () => {
      try {
        const res = await fetch('/api/user/purchases')
        const data = await res.json()
        if (res.ok) {
          setPurchases(Array.isArray(data.purchases) ? data.purchases : [])
        } else {
          setError(data.error || 'Failed to load purchases')
        }
      } catch (e) {
        setError('Failed to load purchases')
      } finally {
        setLoading(false)
      }
    }

    loadPurchases()
  }, [status])

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

  const statusColors = {
    pending: { bg: 'rgba(251, 146, 60, 0.1)', text: '#d97706', label: '⏳ Pending' },
    accepted: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', label: '✓ Accepted' },
    rejected: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', label: '✗ Rejected' },
    completed: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', label: '✓ Completed' }
  }

  return (
    <div>
      <Navbar />
      <main className="container">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>My Purchase Offers</h2>

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

          {purchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <p>No purchase offers yet</p>
              <a href="/market" className="btn btn-outline">Browse Properties</a>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Property</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Agent</th>
                    <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Asking Price</th>
                    <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Your Offer</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(purchase => {
                    const status = statusColors[purchase.status] || statusColors.pending
                    const daysUntilExpiry = Math.ceil(
                      (new Date(purchase.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
                    )

                    return (
                      <tr key={purchase.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 12, fontSize: 14 }}>
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: 12, fontSize: 14 }}>
                          Property {purchase.propertyId.substring(0, 8)}
                        </td>
                        <td style={{ padding: 12, fontSize: 14 }}>
                          {purchase.agentEmail}
                        </td>
                        <td style={{ padding: 12, fontSize: 14, textAlign: 'right' }}>
                          R{purchase.listingPrice.toLocaleString()}
                        </td>
                        <td style={{ padding: 12, fontSize: 14, textAlign: 'right', fontWeight: 600 }}>
                          R{purchase.offeredPrice.toLocaleString()}
                        </td>
                        <td style={{ padding: 12, fontSize: 12, textAlign: 'center' }}>
                          <span style={{
                            background: status.bg,
                            color: status.text,
                            padding: '4px 8px',
                            borderRadius: 4,
                            display: 'inline-block'
                          }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ padding: 12, fontSize: 12, textAlign: 'center' }}>
                          {daysUntilExpiry > 0 ? `${daysUntilExpiry}d` : 'Expired'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Summary */}
              <div style={{
                marginTop: 24,
                paddingTop: 24,
                borderTop: '2px solid #e5e7eb',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16
              }}>
                <div style={{
                  background: 'rgba(79, 70, 229, 0.08)',
                  border: '1px solid rgba(79, 70, 229, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Total Offers</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {purchases.length}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(251, 146, 60, 0.08)',
                  border: '1px solid rgba(251, 146, 60, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Pending</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {purchases.filter(p => p.status === 'pending').length}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Accepted</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {purchases.filter(p => p.status === 'accepted').length}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Total Offered</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    R{purchases.reduce((sum, p) => sum + p.offeredPrice, 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
