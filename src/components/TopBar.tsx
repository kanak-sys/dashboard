import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  dashboard: { title: 'Overview', sub: 'Your financial summary at a glance' },
  transactions: { title: 'Transactions', sub: 'Browse and manage your activity' },
  insights: { title: 'Insights', sub: 'Understand your spending patterns' },
};

export default function TopBar() {
  const { role, setRole, darkMode, toggleDarkMode, activeTab } = useStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const page = PAGE_TITLES[activeTab] || PAGE_TITLES.dashboard;

  return (
    <header className="topbar">
      <div className="topbar-left" style={{ marginLeft: '0' }}>
        <div className="topbar-title">{page.title}</div>
        <div className="topbar-sub">{format(now, "EEEE, dd MMMM yyyy")} · {page.sub}</div>
      </div>

      <div className="topbar-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
          <span>Role:</span>
        </div>
        <select
          className="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value as 'viewer' | 'admin')}
        >
          <option value="viewer">👁️ Viewer</option>
          <option value="admin">🔑 Admin</option>
        </select>

        <button className={`icon-btn${darkMode ? ' active' : ''}`} onClick={toggleDarkMode} title="Toggle dark mode">
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
