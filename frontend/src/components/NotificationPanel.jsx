import React from 'react'
import { useWebSocket } from '../context/WebSocketContext.jsx'

const TYPE_LABELS = {
  NEW_REQUEST: { icon: '📩', label: 'New Barter Request', color: 'var(--clr-primary)' },
  REQUEST_STATUS_UPDATED: { icon: '🔄', label: 'Request Updated', color: 'var(--clr-accent)' },
  SESSION_COMPLETED: { icon: '✅', label: 'Session Completed', color: 'var(--clr-success)' },
}

export default function NotificationPanel({ onClose }) {
  const { notifications, markAllRead } = useWebSocket()

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 12px)', right: 0,
      width: '340px', maxHeight: '420px', overflowY: 'auto',
      background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
      zIndex: 200,
    }}>
      <div className="flex-between" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--clr-border)' }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
        <div className="flex-gap">
          <button
            onClick={markAllRead}
            style={{ background: 'none', border: 'none', color: 'var(--clr-primary)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Mark all read
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-text-faint)' }}>
          No notifications yet
        </div>
      ) : (
        notifications.map(notif => {
          const meta = TYPE_LABELS[notif.type] || { icon: '🔔', label: notif.type, color: 'var(--clr-text-muted)' }
          return (
            <div key={notif.id} style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid var(--clr-border)',
              background: notif.read ? 'transparent' : 'rgba(99,102,241,0.06)',
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{meta.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: meta.color }}>{meta.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '0.15rem' }}>
                  {notif.data?.sender_username && `From: ${notif.data.sender_username}`}
                  {notif.data?.new_status && `Status: ${notif.data.new_status}`}
                </div>
                {!notif.read && <span className="notif-dot" style={{ marginTop: '4px' }} />}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
