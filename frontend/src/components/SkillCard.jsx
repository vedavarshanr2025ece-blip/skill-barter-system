import React from 'react'

/** Reusable card for displaying a user's skill (offered or needed). */
export default function SkillCard({ skill, onDelete }) {
  const isOffered = skill.type === 'OFFERED'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.65rem 1rem',
      background: isOffered ? 'rgba(99,102,241,0.08)' : 'rgba(245,158,11,0.07)',
      border: `1px solid ${isOffered ? 'rgba(99,102,241,0.25)' : 'rgba(245,158,11,0.25)'}`,
      borderRadius: 'var(--radius-md)',
      marginBottom: '0.5rem',
    }}>
      <div className="flex-gap">
        <span style={{ fontSize: '1.1rem' }}>{isOffered ? '🎯' : '🔍'}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{skill.skill_name || skill.skill_id}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
            <span className={`badge ${isOffered ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
              {skill.type}
            </span>
            {skill.proficiency && (
              <span style={{ marginLeft: '0.4rem', color: 'var(--clr-text-faint)' }}>• {skill.proficiency}</span>
            )}
          </div>
        </div>
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(skill.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-faint)', fontSize: '1rem' }}
          aria-label="Remove skill"
          title="Remove skill"
        >
          ✕
        </button>
      )}
    </div>
  )
}
