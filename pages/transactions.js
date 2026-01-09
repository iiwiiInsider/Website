import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '../components/Navbar'

export default function Transactions() {
  const { data: session, status } = useSession() ?? {}
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isAdmin = session?.user?.email === 'admin@local.test'

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false)
      return
    }

    const loadTransactions = async () => {
      try {
        const res = await fetch('/api/revenue/transactions')
        const data = await res.json()
        if (res.ok) {
          setTransactions(Array.isArray(data.transactions) ? data.transactions : [])
        } else {
          setError(data.error || 'Failed to load transactions')
        }
      } catch (e) {
        setError('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
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

  return (
    <div>
      <Navbar />
      <main className="container">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Transaction History</h2>

          {error && (
            <div style={{ color: '#dc2626', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <p>No transactions yet</p>
              <a href="/market" className="btn btn-outline">Browse Market</a>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Property</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Agent</th>
                    {isAdmin && <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Buyer</th>}
                    <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Agent Earnings</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(txn => (
                    <tr key={txn.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {txn.description || `Property ${txn.propertyId}`}
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {txn.agentEmail}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: 12, fontSize: 14 }}>
                          {txn.buyerEmail || '—'}
                        </td>
                      )}
                      <td style={{ padding: 12, fontSize: 14, textAlign: 'right', fontWeight: 600 }}>
                        R{txn.listingPrice?.toLocaleString()}
                      </td>
                      <td style={{ padding: 12, fontSize: 14, textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                        R{txn.breakdown?.agentEarnings?.toLocaleString()}
                      </td>
                      <td style={{ padding: 12, fontSize: 12, textAlign: 'center' }}>
                        <span style={{
                          background: txn.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                          color: txn.status === 'completed' ? '#16a34a' : '#4b5563',
                          padding: '4px 8px',
                          borderRadius: 4,
                          textTransform: 'capitalize'
                        }}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Stats for Admin */}
          {isAdmin && transactions.length > 0 && (
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
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Total Transactions</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {transactions.length}
                </div>
              </div>

              <div style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: 8,
                padding: 16
              }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Total Volume</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  R{transactions.reduce((sum, t) => sum + (t.listingPrice || 0), 0).toLocaleString()}
                </div>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 8,
                padding: 16
              }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Platform Revenue</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  R{transactions.reduce((sum, t) => sum + (t.breakdown?.platformFee || 0), 0).toLocaleString()}
                </div>
              </div>

              <div style={{
                background: 'rgba(251, 146, 60, 0.08)',
                border: '1px solid rgba(251, 146, 60, 0.2)',
                borderRadius: 8,
                padding: 16
              }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Agent Commissions</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  R{transactions.reduce((sum, t) => sum + (t.breakdown?.agentEarnings || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
