import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useWebSocket } from '../context/WebSocketContext.jsx'
import NotificationPanel from './NotificationPanel.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { unreadCount } = useWebSocket()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="navbar-brand">⚡ SkillBarter</NavLink>

      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/discover" className={({ isActive }) => isActive ? 'active' : ''}>
          <span>Discover</span>
        </NavLink>
        <NavLink to="/requests" className={({ isActive }) => isActive ? 'active' : ''}>
          <span>Requests</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
          <span>Profile</span>
        </NavLink>
      </div>

      <div className="flex-gap" style={{ position: 'relative' }}>
        {user && (
          <div className="credit-chip">
            ✦ {user.credit_balance ?? 0} credits
          </div>
        )}

        {/* Notification bell */}
        <button
          id="notif-bell-btn"
          onClick={() => setShowNotifs(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            position: 'relative', padding: '0.4rem', color: 'var(--clr-text-muted)',
            fontSize: '1.2rem'
          }}
          aria-label="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 0, right: 0,
              background: 'var(--clr-danger)', color: '#fff',
              borderRadius: '50%', fontSize: '0.65rem',
              width: '16px', height: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <NotificationPanel onClose={() => setShowNotifs(false)} />
        )}

        <button className="btn btn-secondary btn-sm" onClick={handleLogout} id="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  )
}
