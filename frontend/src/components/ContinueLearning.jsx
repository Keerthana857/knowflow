import React from 'react';
import { ArrowRight, Network, Database, Cpu } from 'lucide-react';

export default function ContinueLearning({ onCardClick }) {
  const courses = [
    {
      id: 'cn',
      title: 'Computer Networks',
      topicsDone: 6,
      totalTopics: 8,
      progress: 75,
      accentColor: '#6366f1',
      accentBg: '#eef2ff',
      icon: Network,
      lastActive: 'Studied 2 hours ago'
    },
    {
      id: 'dbms',
      title: 'Database Management Systems',
      topicsDone: 4,
      totalTopics: 9,
      progress: 45,
      accentColor: '#06b6d4',
      accentBg: '#ecfeff',
      icon: Database,
      lastActive: 'Studied yesterday'
    },
    {
      id: 'ai',
      title: 'Artificial Intelligence',
      topicsDone: 2,
      totalTopics: 10,
      progress: 20,
      accentColor: '#8b5cf6',
      accentBg: '#f5f3ff',
      icon: Cpu,
      lastActive: 'Studied 3 days ago'
    }
  ];

  return (
    <div>
      <div className="section-header">
        <div>
          <h3 className="section-title">Continue Learning</h3>
          <p className="section-subtitle">Pick up right where you left off</p>
        </div>
      </div>

      <div className="learning-cards-grid">
        {courses.map((course) => {
          const Icon = course.icon;
          return (
            <div
              key={course.id}
              className="ui-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: course.accentBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: course.accentColor
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {course.lastActive}
                  </span>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {course.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  {course.topicsDone} of {course.totalTopics} topics completed
                </p>
              </div>

              <div>
                {/* Progress Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ color: course.accentColor }}>{course.progress}%</span>
                  </div>
                  <div style={{
                    height: '6px',
                    backgroundColor: 'var(--bg-card-subtle)',
                    borderRadius: '9999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${course.progress}%`,
                      height: '100%',
                      backgroundColor: course.accentColor,
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Continue button */}
                <button
                  type="button"
                  className="smooth-transition"
                  onClick={() => onCardClick && onCardClick(course)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <span>Continue Learning</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
