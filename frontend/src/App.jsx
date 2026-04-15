import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { WebSocketProvider } from './context/WebSocketContext.jsx'

import Navbar from './components/Navbar.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DiscoverPage from './pages/DiscoverPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RequestsPage from './pages/RequestsPage.jsx'

/** Wraps protected routes — redirects to /login if not authenticated */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  return user ? children : <Navigate to="/login" replace />
}

/** Redirects logged-in users away from auth pages */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/discover"  element={<PrivateRoute><DiscoverPage /></PrivateRoute>} />
        <Route path="/profile"   element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/requests"  element={<PrivateRoute><RequestsPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <AppRoutes />
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
