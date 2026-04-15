import React, { useEffect, useState, useCallback } from 'react'
import { skillsAPI, requestsAPI } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function DiscoverPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)      // user selected to send request to
  const [sending, setSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [resolvedSkillId, setResolvedSkillId] = useState(null)

  const search = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      // 1. Resolve exact skill ID from catalog first
      const catalogRes = await skillsAPI.list()
      const matchedSkill = catalogRes.data.find(s => s.name.toLowerCase().includes(query.toLowerCase()))
      
      if (matchedSkill) {
        setResolvedSkillId(matchedSkill.id)
      } else {
        setResolvedSkillId(null)
      }

      // 2. Search users matching the query
      const res = await skillsAPI.search(query, null, null, 20)
      setResults(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [query])

  const sendRequest = async (receiverId, requestedSkillId, receiverUsername) => {
    if (!requestedSkillId) {
      alert("Error: Exact skill couldn't be resolved. Try a more precise search term!")
      return
    }

    setSending(true)
    try {
      await requestsAPI.create({
        receiver_id: receiverId,
        requested_skill_id: requestedSkillId,
        offered_skill_id: null,  // user can customise this later
      })
      
      const msg = `Request sent successfully to ${receiverUsername}! 🎉`
      setSuccessMsg(msg)
      alert(msg) // Popup message as requested
      setSelected(null)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (e) {
      console.error(e)
      alert("Failed to send request: " + (e.response?.data?.detail || e.message))
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="page-wrapper page-enter">
      <h1 style={{ marginBottom: '0.25rem' }}>🔭 Discover Skills</h1>
      <p style={{ marginBottom: '1.75rem' }}>Search for people offering skills you need, nearby or anywhere.</p>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <input
          id="discover-search-input"
          className="form-control"
          placeholder='Search a skill, e.g. "Python", "Guitar", "Yoga"…'
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          style={{ flex: 1 }}
        />
        <button id="discover-search-btn" className="btn btn-primary" onClick={search} disabled={loading}>
          {loading ? '…' : '🔍 Search'}
        </button>
      </div>

      {/* Results */}
      {results.length === 0 && !loading && query && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--clr-text-muted)' }}>
          No users found offering "{query}" nearby. Try a different skill or expand your radius.
        </div>
      )}

      <div className="grid-2">
        {results.map(result => (
          <div key={result.id} className="card">
            <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>👤 {result.username}</div>
                {result.latitude && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>📍 Location available</div>
                )}
              </div>
              <div className="credit-chip" style={{ fontSize: '0.78rem' }}>✦ {result.credit_balance}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 500 }}>Matching your search:</div>
              <span className="badge badge-primary">{query}</span>
            </div>

            <button
              id={`send-request-btn-${result.id}`}
              className="btn btn-primary btn-sm"
              disabled={sending}
              onClick={() => setSelected(result)}
            >
              📩 Send Request
            </button>
          </div>
        ))}
      </div>

      {/* Modal: confirm request */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Confirm Request</h3>
            <p style={{ marginBottom: '1.25rem' }}>
              Send a barter request to <strong style={{ color: 'var(--clr-primary)' }}>{selected.username}</strong> asking for skill matching "<em>{query}</em>"?
            </p>
            <div className="flex-gap">
              <button
                id="confirm-request-btn"
                className="btn btn-primary"
                disabled={sending}
                onClick={() => sendRequest(selected.id, resolvedSkillId, selected.username)}
              >
                {sending ? 'Sending…' : 'Send Request'}
              </button>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
