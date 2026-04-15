import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { userAPI, skillsAPI } from '../services/api.js'
import SkillCard from '../components/SkillCard.jsx'

const PROFICIENCY_OPTIONS = ['BEGINNER', 'INTERMEDIATE', 'EXPERT']

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [skills, setSkills] = useState([])
  const [allSkills, setAllSkills] = useState([])
  const [form, setForm] = useState({ skill_id: '', type: 'OFFERED', proficiency: 'INTERMEDIATE' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [skillsRes, catalogRes] = await Promise.all([userAPI.mySkills(), skillsAPI.list()])
      setSkills(skillsRes.data)
      setAllSkills(catalogRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleAdd = async e => {
    e.preventDefault()
    if (!form.skill_id) { setError('Please select a skill.'); return }
    setSaving(true)
    setError('')
    try {
      await userAPI.addSkill({
        skill_id: form.skill_id,
        type: form.type,
        proficiency: form.type === 'OFFERED' ? form.proficiency : null,
      })
      setSuccess('Skill added! ✓')
      setTimeout(() => setSuccess(''), 3000)
      await loadData()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to add skill.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (skillEntryId) => {
    try {
      await userAPI.deleteSkill(skillEntryId)
      await loadData()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  const offeredSkills = skills.filter(s => s.type === 'OFFERED')
  const neededSkills = skills.filter(s => s.type === 'NEEDED')

  return (
    <main className="page-wrapper page-enter">
      <h1 style={{ marginBottom: '0.25rem' }}>👤 My Profile</h1>
      <p style={{ marginBottom: '2rem' }}>Manage your skills and account information.</p>

      {/* Profile info card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dim))',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 800, color: '#fff',
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>{user?.username}</h2>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{user?.email}</p>
            <div className="credit-chip" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              ✦ {user?.credit_balance} credits
            </div>
          </div>
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>🎯 Skills I Offer</h3>
          {offeredSkills.length === 0
            ? <p style={{ color: 'var(--clr-text-faint)' }}>None added yet.</p>
            : offeredSkills.map(s => <SkillCard key={s.id} skill={s} onDelete={handleDelete} />)
          }
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>🔍 Skills I Need</h3>
          {neededSkills.length === 0
            ? <p style={{ color: 'var(--clr-text-faint)' }}>None added yet.</p>
            : neededSkills.map(s => <SkillCard key={s.id} skill={s} onDelete={handleDelete} />)
          }
        </div>
      </div>

      {/* Add skill form */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem' }}>➕ Add a Skill</h3>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="skill-select">Skill</label>
              <select
                id="skill-select"
                className="form-control"
                value={form.skill_id}
                onChange={e => setForm(f => ({ ...f, skill_id: e.target.value }))}
              >
                <option value="">— Select a skill —</option>
                {allSkills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="skill-type">Type</label>
              <select id="skill-type" className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="OFFERED">Offering</option>
                <option value="NEEDED">Needed</option>
              </select>
            </div>
            {form.type === 'OFFERED' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="skill-proficiency">Level</label>
                <select id="skill-proficiency" className="form-control" value={form.proficiency} onChange={e => setForm(f => ({ ...f, proficiency: e.target.value }))}>
                  {PROFICIENCY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            <button id="add-skill-btn" className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? '…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
