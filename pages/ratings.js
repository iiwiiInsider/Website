import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '../components/Navbar'

export default function AgentRatings() {
  const { data: session, status } = useSession()
  const [ratings, setRatings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewAgent, setViewAgent] = useState(null)
  const [formData, setFormData] = useState({
    agentEmail: '',
    rating: 5,
    comment: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return

    const loadRatings = async () => {
      try {
        const res = await fetch(`/api/ratings/agent?email=${encodeURIComponent(session.user.email)}`)
        const data = await res.json()
        if (res.ok) {
          setRatings(data)
        } else {
          setError(data.error || 'Failed to load ratings')
        }
      } catch (e) {
        setError('Failed to load ratings')
      } finally {
        setLoading(false)
      }
    }

    loadRatings()
  }, [session?.user?.email, status])

  const handleSubmitRating = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!formData.agentEmail || !formData.rating) {
      setSubmitError('Agent email and rating are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/ratings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentEmail: formData.agentEmail.toLowerCase(),
          rating: Number(formData.rating),
          comment: formData.comment
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit rating')

      setSubmitSuccess(true)
      setFormData({ agentEmail: '', rating: 5, comment: '' })
      setTimeout(() => setSubmitSuccess(false), 3000)

      // Reload ratings
      const reloadRes = await fetch(`/api/ratings/agent?email=${encodeURIComponent(formData.agentEmail)}`)
      const reloadData = await reloadRes.json()
      if (reloadRes.ok) setRatings(reloadData)
    } catch (e) {
      setSubmitError(e.message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Rating Form */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Rate an Agent</h3>

            {submitSuccess && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#16a34a',
                padding: 12,
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 14
              }}>
                ✓ Rating submitted successfully!
              </div>
            )}

            {submitError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#dc2626',
                padding: 12,
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 14
              }}>
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitRating}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                  Agent Email
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="agent@example.com"
                  value={formData.agentEmail}
                  onChange={(e) => setFormData(f => ({ ...f, agentEmail: e.target.value }))}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                  Rating: {formData.rating} ★
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData(f => ({ ...f, rating: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                  Comment (optional)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Share your experience with this agent..."
                  value={formData.comment}
                  onChange={(e) => setFormData(f => ({ ...f, comment: e.target.value }))}
                />
              </div>

              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Rating'}
              </button>
            </form>
          </div>

          {/* Current Ratings */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Your Rating Profile</h3>

            {error && (
              <div style={{ color: '#dc2626', marginBottom: 16 }}>
                {error}
              </div>
            )}

            {ratings && (
              <div>
                <div style={{
                  background: 'rgba(251, 146, 60, 0.08)',
                  border: '1px solid rgba(251, 146, 60, 0.2)',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16
                }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Average Rating</div>
                  <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
                    {ratings.averageRating ? `${ratings.averageRating}` : 'No ratings yet'}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                    Based on {ratings.totalReviews || 0} review{ratings.totalReviews !== 1 ? 's' : ''}
                  </div>
                </div>

                {ratings.reviews && ratings.reviews.length > 0 && (
                  <div>
                    <h4 style={{ marginTop: 16, marginBottom: 12 }}>Recent Reviews</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {ratings.reviews.slice(0, 5).map(review => (
                        <div key={review.id} style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: 6,
                          padding: 12
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ fontWeight: 500 }}>
                              {'★'.repeat(review.rating)}
                              {'☆'.repeat(5 - review.rating)}
                            </div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {review.comment && (
                            <div style={{ fontSize: 14, color: '#4b5563' }}>
                              {review.comment}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
