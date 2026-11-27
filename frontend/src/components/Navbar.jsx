import React from 'react';
import { FileUp, GitFork, BookOpen, Target } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'upload', label: '1. Document & Ingestion', icon: FileUp },
    { id: 'graph', label: '2. Knowledge Graph', icon: GitFork },
    { id: 'learn', label: '3. Chunked Learning', icon: BookOpen },
    { id: 'quiz', label: '4. Quizzes & Gap Analysis', icon: Target }
  ];

  return (
    <nav style={{
      display: 'flex',
      gap: '0.5rem',
      backgroundColor: 'var(--bg-secondary)',
      padding: '0.5rem',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      marginBottom: '1.75rem',
      overflowX: 'auto'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: isActive ? '#ffffff' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
