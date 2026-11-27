import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import UploadCard from './components/UploadCard';
import StatCards from './components/StatCard';
import ContinueLearning from './components/ContinueLearning';
import TodayPlan from './components/TodayPlan';
import QuickAccess from './components/QuickAccess';

import './App.css';

export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [actionFeedback, setActionFeedback] = useState('');

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    setActionFeedback(`Loaded "${file.name}" into dashboard.`);
    setTimeout(() => setActionFeedback(''), 4000);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setActionFeedback('File removed.');
    setTimeout(() => setActionFeedback(''), 3000);
  };

  const handleQuickAccessNavigate = (id) => {
    if (id === 'knowledge-map') {
      setActiveNav('knowledge-map');
    } else if (id === 'practice-quiz') {
      setActiveNav('practice-quiz');
    } else {
      setActionFeedback('Quick Learn mode ready — will load concepts from uploaded material in Stage 4.');
      setTimeout(() => setActionFeedback(''), 4000);
    }
  };

  const handleContinueCourse = (course) => {
    setActionFeedback(`Opening "${course.title}" module.`);
    setTimeout(() => setActionFeedback(''), 3000);
  };

  return (
    <div className="dashboard-layout">
      {/* 1. Sidebar */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* 2. Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <TopBar onOpenMobileMenu={() => setIsMobileOpen(true)} />

        {/* Temporary Notification Banner */}
        {actionFeedback && (
          <div style={{
            backgroundColor: 'var(--accent-primary-light)',
            borderBottom: '1px solid var(--accent-primary-border)',
            color: 'var(--accent-primary)',
            padding: '0.6rem 2rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{actionFeedback}</span>
            <button
              onClick={() => setActionFeedback('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Body */}
        <main className="dashboard-content">
          {activeNav === 'dashboard' ? (
            <>
              {/* 3. Upload Section */}
              <UploadCard
                selectedFile={selectedFile}
                onSelectFile={handleSelectFile}
                onClearFile={handleClearFile}
              />

              {/* 4. Learning Overview (3 Stat Cards) */}
              <StatCards />

              {/* 5, 6, 7. Main Dashboard Columns */}
              <div className="dashboard-columns">
                {/* Left Column: Continue Learning + Quick Access */}
                <div className="left-column">
                  <ContinueLearning onCardClick={handleContinueCourse} />
                  <QuickAccess onNavigate={handleQuickAccessNavigate} />
                </div>

                {/* Right Column: Today's Learning Plan + AI Study Tip */}
                <div className="right-column">
                  <TodayPlan />

                  {/* AI Study Tip Card */}
                  <div className="ui-card" style={{
                    padding: '1.25rem',
                    backgroundColor: '#ffffff',
                    borderLeft: '4px solid var(--accent-purple)'
                  }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      💡 Cognitive Science Tip
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      Passive reading yields under 20% retention after 48 hours. Chunking concepts into <strong>prerequisite sequences</strong> and active retrieval testing boosts recall to 80%+.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Clean Section Placeholder for Non-Dashboard Nav items */
            <div className="ui-card" style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: '#ffffff'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                fontSize: '1.5rem'
              }}>
                ✦
              </div>

              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {activeNav.replace('-', ' ').toUpperCase()}
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
                  This view will connect dynamically to the backend and Gemini AI in our upcoming development stages.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveNav('dashboard')}
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
