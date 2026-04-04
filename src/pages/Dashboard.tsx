import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { useStore } from '../store/useStore';
import {
  getSummaryStats, getMonthlyData, getCategoryBreakdown,
  formatCurrency, formatDate, CATEGORY_ICONS, CATEGORY_COLORS,
} from '../utils/helpers';
import type { TransactionCategory } from '../types';
import SpendingBalls from '../components/SpendingBalls';

function useCountUp(target: number, duration = 1600) {
  const [val, setVal] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef<number>(0);
  useEffect(() => {
    start.current = null;
    const step = (ts: number) => {
      if (!start.current) start.current = ts;
      const progress = Math.min((ts - start.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * ease));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

function StatCard({ type, icon, label, raw, isSavings, sub, subClass }: {
  type: string; icon: string; label: string; raw: number;
  isSavings?: boolean; sub?: string; subClass?: string;
}) {
  const animated = useCountUp(raw);
  return (
    <div className={`stat-card ${type}`}>
      <div className={`stat-icon ${type}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${type}`}>
        {isSavings ? `${animated}%` : `₹${animated.toLocaleString('en-IN')}`}
      </div>
      {sub && <div className={`stat-change ${subClass}`}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'rgba(27,58,45,0.92)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12,
        padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}>
        <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#F5F0E8' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ fontSize: 12, color: p.color, fontWeight: 500 }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { transactions } = useStore();
  const stats = getSummaryStats(transactions);
  const monthly = getMonthlyData(transactions);
  const categories = getCategoryBreakdown(transactions);
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const ballData = categories.map((cat) => ({
    name: cat.name,
    value: cat.value,
    color: CATEGORY_COLORS[cat.name as TransactionCategory] || '#AEB6BF',
    icon: CATEGORY_ICONS[cat.name as TransactionCategory] || '💰',
  }));

  return (
    <div>
      <div className="stat-cards">
        <StatCard type="balance" icon="💰" label="Total Balance" raw={stats.balance}
          sub={`${stats.savingsRate}% savings rate`} subClass={stats.savingsRate >= 20 ? 'up' : 'down'} />
        <StatCard type="income" icon="📈" label="Total Income" raw={stats.income}
          sub="↑ All time" subClass="up" />
        <StatCard type="expense" icon="📉" label="Total Expenses" raw={stats.expenses}
          sub="↓ All spending" subClass="down" />
        <StatCard type="savings" icon="🎯" label="Savings Rate" raw={stats.savingsRate} isSavings
          sub={stats.savingsRate >= 20 ? '✓ On track' : '⚠ Below target'}
          subClass={stats.savingsRate >= 20 ? 'up' : 'down'} />
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Balance Trend</div>
              <div className="section-sub">Monthly income vs expenses</div>
            </div>
          </div>
          {monthly.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">No data yet</div></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2D7A45" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2D7A45" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#C0392B" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#C0392B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,200,190,0.3)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income"   stroke="#2D7A45" strokeWidth={2.5} fill="url(#incomeGrad)"  name="Income" />
                <Area type="monotone" dataKey="expenses" stroke="#C0392B" strokeWidth={2.5} fill="url(#expenseGrad)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Spending Breakdown</div>
              <div className="section-sub">Hover to repulse · Size = spend amount</div>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
              color: 'var(--gold)', background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '4px 8px',
            }}>Live</div>
          </div>
          {categories.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🥧</div><div className="empty-title">No expenses yet</div></div>
          ) : (
            <SpendingBalls categories={ballData} totalExpenses={stats.expenses} />
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div>
            <div className="section-title">Monthly Summary</div>
            <div className="section-sub">Income, expenses & net balance per month</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,200,190,0.3)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="income"   fill="#2D7A45" radius={[5,5,0,0]} name="Income"      opacity={0.85} />
            <Bar dataKey="expenses" fill="#C0392B" radius={[5,5,0,0]} name="Expenses"    opacity={0.85} />
            <Bar dataKey="balance"  fill="#C9A84C" radius={[5,5,0,0]} name="Net Balance" opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Recent Transactions</div>
            <div className="section-sub">Latest 5 activities</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => useStore.getState().setActiveTab('transactions')}>
            View All →
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">💳</div><div className="empty-title">No transactions yet</div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recent.map((tx, i) => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0, boxShadow: '0 2px 8px rgba(27,58,45,0.08)',
                }}>
                  {CATEGORY_ICONS[tx.category as TransactionCategory]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.merchant} · {formatDate(tx.date)}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className={`tx-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  <span className={`type-pill ${tx.type}`}>{tx.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
