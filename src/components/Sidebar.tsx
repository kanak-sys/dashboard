import { useState } from 'react';
import { useStore } from '../store/useStore';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'transactions', label: 'Transactions', icon: '💳' },
  { id: 'insights', label: 'Insights', icon: '💡' },
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
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💹</div>
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
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="role-badge">
            <div className={`role-dot ${role}`} />
            <div>
              <div className="role-label">Current Role</div>
              <div className="role-value">{role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
