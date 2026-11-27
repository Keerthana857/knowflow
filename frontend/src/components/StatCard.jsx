import React from 'react';
import { Files, Award, Flame } from 'lucide-react';

export default function StatCards() {
  const stats = [
    {
      title: 'Documents Uploaded',
      value: '4',
      subtext: '+2 added this week',
      icon: Files,
      color: 'var(--accent-primary)',
      bgColor: 'var(--accent-primary-light)',
      borderColor: 'var(--accent-primary-border)'
    },
    {
      title: 'Concepts Mastered',
      value: '28',
      subtext: '85% quiz accuracy',
      icon: Award,
      color: '#059669',
      bgColor: 'var(--accent-emerald-light)',
      borderColor: '#a7f3d0'
    },
    {
      title: 'Learning Streak',
      value: '5 Days',
      subtext: 'Personal best streak 🔥',
      icon: Flame,
      color: '#d97706',
      bgColor: 'var(--accent-amber-light)',
      borderColor: '#fde68a'
    }
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="ui-card"
            style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <p style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                {stat.title}
              </p>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {stat.subtext}
              </div>
            </div>

            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: stat.bgColor,
              border: `1px solid ${stat.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stat.color
            }}>
              <Icon size={24} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
