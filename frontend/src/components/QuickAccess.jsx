import React from 'react';
import { Zap, GitFork, CheckSquare, ChevronRight } from 'lucide-react';

export default function QuickAccess({ onNavigate }) {
  const actions = [
    {
      id: 'quick-learn',
      title: 'Quick Learn',
      description: '5-minute bite-sized cognitive chunks for rapid concept refreshers.',
      icon: Zap,
      accentColor: '#6366f1',
      bgColor: '#eef2ff',
      badge: 'Bite-Sized'
    },
    {
      id: 'knowledge-map',
      title: 'Knowledge Map',
      description: 'Explore visual prerequisite graphs and topological learning order.',
      icon: GitFork,
      accentColor: '#06b6d4',
      bgColor: '#ecfeff',
      badge: 'Interactive'
    },
    {
      id: 'practice-quiz',
      title: 'Practice Quiz',
      description: 'Test true understanding, diagnose gaps, and adapt your study route.',
      icon: CheckSquare,
      accentColor: '#8b5cf6',
      bgColor: '#f5f3ff',
      badge: 'Adaptive'
    }
  ];

  return (
    <div>
      <div className="section-header">
        <div>
          <h3 className="section-title">Quick Access</h3>
          <p className="section-subtitle">Jump straight into your learning tools</p>
        </div>
      </div>

      <div className="quick-access-grid">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className="ui-card smooth-transition"
              onClick={() => onNavigate && onNavigate(action.id)}
              style={{
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#c7d2fe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: action.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: action.accentColor
                  }}>
                    <Icon size={22} />
                  </div>
                  <span className="badge-pill badge-purple" style={{ fontSize: '0.7rem' }}>
                    {action.badge}
                  </span>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {action.title}
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                  {action.description}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: action.accentColor,
                marginTop: '0.5rem'
              }}>
                <span>Open tool</span>
                <ChevronRight size={15} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
