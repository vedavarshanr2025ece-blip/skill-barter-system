import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { matchesAPI, requestsAPI } from '../services/api.js'
import { useWebSocket } from '../context/WebSocketContext.jsx'

export default function DashboardPage() {
  const { user } = useAuth()
  const { notifications } = useWebSocket()
  const [matches, setMatches] = useState([])
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([matchesAPI.recommendations(5), requestsAPI.list()])
      .then(([mRes, rRes]) => {
        setMatches(mRes.data.recommendations || [])
        setRecentRequests((rRes.data || []).slice(0, 5))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <main className="page-wrapper page-enter">
      {/* Hero greeting */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>
          Hey, <span style={{ color: 'var(--clr-primary)' }}>{user?.username}</span> 👋
        </h1>
        <p>Welcome back to your skill exchange hub.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Credit Balance', value: `✦ ${user?.credit_balance ?? 0}`, color: 'var(--clr-accent)' },
            { label: 'Pending Requests', value: recentRequests.filter(r => r.status === 'PENDING').length, color: 'var(--clr-primary)' },
            { label: 'New Matches', value: matches.length, color: 'var(--clr-success)' },
          ].map(stat => (
            <div key={stat.label} className="card card-sm" style={{ minWidth: '160px', flex: '1' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '0.2rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Matches */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h2>🤝 Top Matches For You</h2>
          <Link to="/discover" className="btn btn-secondary btn-sm">See all →</Link>
        </div>
        {matches.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--clr-text-muted)' }}>
            <p>No matches yet. <Link to="/profile">Add your skills</Link> to get started!</p>
          </div>
        ) : (
          <div className="grid-3">
            {matches.map(match => (
              <div key={match.user_id} className="card">
                <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{match.username}</div>
                    {match.distance_km !== null && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                        📍 {match.distance_km} km away
                      </div>
                    )}
                  </div>
                  <div
                    className="score-ring"
                    style={{ '--pct': match.match_score }}
                    title={`Match score: ${match.match_score}`}
                  >
                    <span>{Math.round(match.match_score)}</span>
                  </div>
                </div>
                {match.is_mutual_swap && (
                  <span className="badge badge-success" style={{ marginBottom: '0.75rem' }}>⚡ Direct Swap</span>
                )}
                <Link to="/discover" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                  Connect →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Requests */}
      <section>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h2>📬 Recent Requests</h2>
          <Link to="/requests" className="btn btn-secondary btn-sm">All requests →</Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--clr-text-muted)' }}>
            <p>No barter requests yet! Go <Link to="/discover">Discover</Link> people to connect with.</p>
          </div>
        ) : (
          recentRequests.map(req => (
            <div key={req.id} className="card card-sm" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem' }}>
                {req.sender_id === user?.id ? '📤 Sent' : '📩 Received'} — #{req.id.slice(0, 8)}
              </span>
              <span className={`badge ${req.status === 'ACCEPTED' ? 'badge-success' : req.status === 'PENDING' ? 'badge-warning' : 'badge-muted'}`}>
                {req.status}
              </span>
            </div>
          ))
        )}
      </section>
    </main>
  )
}
