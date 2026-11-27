import React, { useState } from 'react';
import { Menu, Bell, User } from 'lucide-react';

export default function TopBar({ onOpenMobileMenu }) {
  const [showNotification, setShowNotification] = useState(false);

  return (
    <header className="top-bar">
      {/* Left: Hamburger + Greeting */}
      <div className="top-bar-left">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="greeting-title">
            Good afternoon, Learner 👋
          </h1>
          <p className="greeting-subtitle">
            Turn information into knowledge. Learn smarter, not harder.
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="top-bar-actions">
        {/* Notification Icon */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowNotification(!showNotification)}
            title="Notifications"
          >
            <Bell size={18} />
            <span className="notification-dot" />
          </button>

          {/* Simple notification popover */}
          {showNotification && (
            <div
              className="ui-card"
              style={{
                position: 'absolute',
                right: 0,
                top: '50px',
                width: '290px',
                padding: '1rem',
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-dropdown)',
                zIndex: 50,
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Notifications
                </span>
                <span className="badge-pill badge-purple" style={{ fontSize: '0.7rem' }}>
                  1 New
                </span>
              </div>
              <div style={{
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-primary-light)',
                border: '1px solid var(--accent-primary-border)',
                fontSize: '0.8rem',
                color: 'var(--text-main)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '2px' }}>
                  Daily Streak Maintained! 🔥
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  You have logged in 5 days in a row. Keep the momentum going!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="user-profile-badge" title="Student Profile">
          <div className="user-avatar">
            <User size={18} />
          </div>
          <span className="user-name">Learner</span>
        </div>
      </div>
    </header>
  );
}
