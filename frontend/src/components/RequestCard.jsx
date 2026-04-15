import React, { useState } from 'react'
import { requestsAPI } from '../services/api.js'

const STATUS_META = {
  PENDING:   { color: 'var(--clr-accent)',   icon: '⏳', badge: 'badge-warning' },
  ACCEPTED:  { color: 'var(--clr-success)',  icon: '✅', badge: 'badge-success' },
  REJECTED:  { color: 'var(--clr-danger)',   icon: '❌', badge: 'badge-danger' },
  CANCELLED: { color: 'var(--clr-text-faint)', icon: '🚫', badge: 'badge-muted' },
}

export default function RequestCard({ request, currentUserId, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const meta = STATUS_META[request.status] || STATUS_META.PENDING
  const isReceiver = request.receiver_id === currentUserId

  const handleStatus = async (status) => {
    setLoading(true)
    try {
      await requestsAPI.updateStatus(request.id, status)
      onRefresh?.()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card card-sm" style={{ marginBottom: '1rem' }}>
      <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
          {meta.icon} Request #{request.id.slice(0, 8)}
        </span>
        <span className={`badge ${meta.badge}`}>{request.status}</span>
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.75rem' }}>
        {isReceiver
          ? `📩 Incoming request — Sender: ${request.sender_id.slice(0, 8)}`
          : `📤 Your request → Receiver: ${request.receiver_id.slice(0, 8)}`}
      </div>

      {request.status === 'PENDING' && (
        <div className="flex-gap">
          {isReceiver && (
            <>
              <button
                id={`accept-btn-${request.id}`}
                className="btn btn-success btn-sm"
                onClick={() => handleStatus('ACCEPTED')}
                disabled={loading}
              >
                Accept
              </button>
              <button
                id={`reject-btn-${request.id}`}
                className="btn btn-danger btn-sm"
                onClick={() => handleStatus('REJECTED')}
                disabled={loading}
              >
                Reject
              </button>
            </>
          )}
          {!isReceiver && (
            <button
              id={`cancel-btn-${request.id}`}
              className="btn btn-secondary btn-sm"
              onClick={() => handleStatus('CANCELLED')}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}
