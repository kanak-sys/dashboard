import { useState } from 'react';
import { useStore } from '../store/useStore';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/>
        <rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
        <line x1="7" y1="15" x2="7.01" y2="15" strokeWidth="2.5"/>
        <line x1="11" y1="15" x2="13" y2="15"/>
      </svg>
    ),
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v4"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, role } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="hamburger icon-btn" style={{ position: 'fixed', top: 14, left: 14, zIndex: 200 }} onClick={() => setOpen(!open)}>
        ☰
      </button>
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }} onClick={() => setOpen(false)} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        {/* Premium radial gradient overlay */}
        <div className="sidebar-glow-top" />
        <div className="sidebar-glow-bottom" />

        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-logo-text">FinTrack</div>
            <div className="sidebar-logo-sub">Dashboard</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => { setActiveTab(item.id); setOpen(false); }}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
              {activeTab === item.id && <span className="nav-item-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="role-badge">
            <div className="role-badge-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5z"/>
                <path d="M2 20c0-4 4-7 10-7s10 3 10 7"/>
              </svg>
            </div>
            <div>
              <div className="role-label">Current Role</div>
              <div className="role-value">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
            </div>
            <div className={`role-dot ${role}`} style={{ marginLeft: 'auto' }} />
          </div>
        </div>
      </aside>
    </>
  );
}
