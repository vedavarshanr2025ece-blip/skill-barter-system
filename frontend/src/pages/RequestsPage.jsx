import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { requestsAPI, sessionsAPI } from '../services/api.js'
import RequestCard from '../components/RequestCard.jsx'

export default function RequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [reviewModal, setReviewModal] = useState(null)   // { sessionId }
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewSending, setReviewSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const loadRequests = useCallback(async () => {
    try {
      const res = await requestsAPI.list()
      setRequests(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRequests() }, [loadRequests])

  const handleComplete = async (sessionId) => {
    try {
      await sessionsAPI.complete(sessionId)
      setSuccessMsg('Session marked complete! Credits processed. ✓')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (e) {
      console.error(e)
    }
  }

  const handleReviewSubmit = async e => {
    e.preventDefault()
    setReviewSending(true)
    try {
      await sessionsAPI.review(reviewModal.sessionId, reviewForm)
      setSuccessMsg('Review submitted! ✓')
      setReviewModal(null)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setReviewSending(false)
    }
  }

  const filtered = activeTab === 'all'
    ? requests
    : activeTab === 'inbound'
      ? requests.filter(r => r.receiver_id === user?.id)
      : requests.filter(r => r.sender_id === user?.id)

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <main className="page-wrapper page-enter">
      <h1 style={{ marginBottom: '0.25rem' }}>📬 Barter Requests</h1>
      <p style={{ marginBottom: '1.75rem' }}>Manage all your incoming and outgoing skill exchange requests.</p>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
        {['all', 'inbound', 'outbound'].map(tab => (
          <button
            key={tab}
            id={`tab-${tab}`}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: 'capitalize' }}
          >
            {tab === 'all' ? '🔁 All' : tab === 'inbound' ? '📩 Inbound' : '📤 Outbound'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--clr-text-muted)', fontSize: '0.85rem', lineHeight: '2.5rem' }}>
          {filtered.length} request{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--clr-text-muted)' }}>
          <p>No {activeTab === 'all' ? '' : activeTab} requests yet.</p>
        </div>
      ) : (
        filtered.map(req => (
          <div key={req.id}>
            <RequestCard
              request={req}
              currentUserId={user?.id}
              onRefresh={loadRequests}
            />
            {/* If accepted + session exists, show complete / review actions */}
            {req.status === 'ACCEPTED' && req.session_id && (
              <div className="flex-gap" style={{ marginTop: '-0.5rem', marginBottom: '1rem', paddingLeft: '0.25rem' }}>
                <button
                  id={`complete-session-btn-${req.session_id}`}
                  className="btn btn-success btn-sm"
                  onClick={() => handleComplete(req.session_id)}
                >
                  ✅ Mark Session Complete
                </button>
                <button
                  id={`review-btn-${req.session_id}`}
                  className="btn btn-secondary btn-sm"
                  onClick={() => setReviewModal({ sessionId: req.session_id })}
                >
                  ⭐ Write Review
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>⭐ Write a Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label htmlFor="review-rating">Rating</label>
                <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n} type="button"
                      onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '1.75rem', color: n <= reviewForm.rating ? 'var(--clr-accent)' : 'var(--clr-border)',
                        transition: 'color 0.15s',
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="review-comment">Comment</label>
                <textarea
                  id="review-comment"
                  className="form-control"
                  rows={3}
                  placeholder="Share your experience…"
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="flex-gap">
                <button id="submit-review-btn" className="btn btn-primary" type="submit" disabled={reviewSending}>
                  {reviewSending ? 'Submitting…' : 'Submit Review'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
