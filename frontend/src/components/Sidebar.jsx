import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  GitFork,
  CheckSquare,
  TrendingUp,
  Settings,
  Brain,
  X,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeNav, setActiveNav, isMobileOpen, setIsMobileOpen }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-learning', label: 'My Learning', icon: BookOpen },
    { id: 'knowledge-map', label: 'Knowledge Map', icon: GitFork },
    { id: 'practice-quiz', label: 'Practice & Quiz', icon: CheckSquare },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'mobile-open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Brain size={20} />
            </div>
            <span>Recall AI</span>
          </div>

          {/* Mobile close button */}
          <button
            className="mobile-menu-btn"
            style={{ border: 'none', padding: '4px' }}
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.75rem 0.5rem 0.75rem' }}>
            Main Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveNav(item.id);
                  setIsMobileOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Subtle Bottom Card */}
        <div className="sidebar-footer">
          <div style={{
            padding: '0.85rem',
            backgroundColor: 'var(--accent-primary-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-primary-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.8rem' }}>
              <Sparkles size={14} /> Rapid Learning Pro
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              Turn large study material into structured memory graphs.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
