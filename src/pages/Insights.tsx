import { useStore } from '../store/useStore';
import {
  getInsights, getMonthlyData, getCategoryBreakdown,
  formatCurrency, CATEGORY_ICONS, getSummaryStats
} from '../utils/helpers';
import type { TransactionCategory } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

function ProgressBar({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-header">
        <span className="progress-bar-label"><span>{icon}</span>{label}</span>
        <span className="progress-bar-val">{formatCurrency(value)} <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Insights() {
  const { transactions } = useStore();
  const insights = getInsights(transactions);
  const monthly = getMonthlyData(transactions);
  const categories = getCategoryBreakdown(transactions);
  const stats = getSummaryStats(transactions);
  const monthChange = insights.monthChange;
  const lastMonth = monthly[monthly.length - 1];
  const prevMonth = monthly[monthly.length - 2];
  const totalExp = insights.totalExpenses;
  const topCategory = insights.highestCategory;

  return (
    <div>
      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-header">
            <span className="insight-icon">🔥</span>
            <span className="insight-badge warning">Highest Spend</span>
          </div>
          <div className="insight-title">Top Spending Category</div>
          <div className="insight-value">{topCategory ? topCategory.name : 'N/A'}</div>
          <div className="insight-desc">
            {topCategory ? `${formatCurrency(topCategory.value)} spent — ${totalExp > 0 ? ((topCategory.value / totalExp) * 100).toFixed(0) : 0}% of total expenses` : 'No expense data available'}
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-header">
            <span className="insight-icon">📅</span>
            <span className={`insight-badge ${monthChange <= 0 ? 'success' : 'warning'}`}>
              {monthChange <= 0 ? '↓ Lower' : '↑ Higher'}
            </span>
          </div>
          <div className="insight-title">Monthly Comparison</div>
          <div className="insight-value">{Math.abs(monthChange).toFixed(0)}%</div>
          <div className="insight-desc">
            {lastMonth && prevMonth
              ? `${lastMonth.name} expenses are ${monthChange > 0 ? 'higher' : 'lower'} than ${prevMonth.name} (${formatCurrency(lastMonth.expenses)} vs ${formatCurrency(prevMonth.expenses)})`
              : 'Need at least 2 months of data for comparison'}
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-header">
            <span className="insight-icon">💼</span>
            <span className="insight-badge info">Top Source</span>
          </div>
          <div className="insight-title">Primary Income Source</div>
          <div className="insight-value">{insights.topIncomeSource ? insights.topIncomeSource[0] : 'N/A'}</div>
          <div className="insight-desc">
            {insights.topIncomeSource ? `${formatCurrency(insights.topIncomeSource[1])} total from this source` : 'No income recorded'}
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-header">
            <span className="insight-icon">📊</span>
            <span className={`insight-badge ${stats.savingsRate >= 20 ? 'success' : 'warning'}`}>
              {stats.savingsRate >= 20 ? 'On Track' : 'Below Target'}
            </span>
          </div>
          <div className="insight-title">Savings Rate</div>
          <div className="insight-value">{stats.savingsRate}%</div>
          <div className="insight-desc">
            {stats.savingsRate >= 20
              ? 'Great job! You are saving more than the recommended 20% of income.'
              : `Try to save at least 20% of your income. Current savings: ${formatCurrency(stats.balance)}`}
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-header">
            <span className="insight-icon">📉</span>
            <span className="insight-badge info">Monthly Avg</span>
          </div>
          <div className="insight-title">Avg Monthly Expense</div>
          <div className="insight-value">{formatCurrency(insights.avgMonthlyExpense)}</div>
          <div className="insight-desc">
            Based on {monthly.length} months of data. Total expenses: {formatCurrency(totalExp)}
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-header">
            <span className="insight-icon">⚖️</span>
            <span className={`insight-badge ${stats.balance >= 0 ? 'success' : 'warning'}`}>
              {stats.balance >= 0 ? 'Positive' : 'Negative'}
            </span>
          </div>
          <div className="insight-title">Net Balance</div>
          <div className="insight-value">{formatCurrency(stats.balance)}</div>
          <div className="insight-desc">
            {stats.balance >= 0
              ? `You are ${formatCurrency(stats.balance)} ahead. Keep it up!`
              : `You are ${formatCurrency(Math.abs(stats.balance))} in deficit. Review expenses.`}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Expense Breakdown by Category</div>
              <div className="section-sub">Where your money goes</div>
            </div>
          </div>
          {categories.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">No data</div></div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categories} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,200,190,0.3)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v: number) => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={110} />
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#2D5A3D" />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
                {categories.map(cat => (
                  <ProgressBar
                    key={cat.name}
                    label={cat.name}
                    value={cat.value}
                    max={categories[0].value}
                    color={cat.color}
                    icon={CATEGORY_ICONS[cat.name as TransactionCategory]}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Net Balance Trend</div>
              <div className="section-sub">Monthly net position</div>
            </div>
          </div>
          {monthly.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📈</div><div className="empty-title">No data</div></div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthly} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,200,190,0.3)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v: number) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  <Line type="monotone" dataKey="balance" stroke="#C9A84C" strokeWidth={2.5} dot={{ fill: '#C9A84C', strokeWidth: 0, r: 4 }} name="Net Balance" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {monthly.map(m => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 56, color: 'var(--text-muted)', fontWeight: 600 }}>{m.name.split(' ')[0]}</span>
                    <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--accent-green)' }}>+{formatCurrency(m.income)}</span>
                      <span style={{ color: 'var(--text-subtle)' }}>·</span>
                      <span style={{ color: 'var(--accent-red)' }}>-{formatCurrency(m.expenses)}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: m.balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {m.balance >= 0 ? '+' : ''}{formatCurrency(m.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
