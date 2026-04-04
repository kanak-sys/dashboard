import { useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Insights from './pages/Insights';
import './index.css';

export default function App() {
  const { darkMode, activeTab } = useStore();
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.left = e.clientX + 'px';
      el.style.top  = e.clientY + 'px';
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':    return <Dashboard />;
      case 'transactions': return <Transactions />;
      case 'insights':     return <Insights />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className={`app-shell${darkMode ? ' dark' : ''}`}>
      <div id="cursor-glow" ref={glowRef} />
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="page-content">{renderPage()}</div>
      </div>
    </div>
  );
}
