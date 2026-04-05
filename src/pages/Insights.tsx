import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  getInsights, getMonthlyData, getCategoryBreakdown,
  formatCurrency, CATEGORY_ICONS, getSummaryStats
} from '../utils/helpers';
import type { TransactionCategory } from '../types';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  Flame, Calendar, Briefcase, TrendingUp, Scale, TrendingDown,
  ChevronRight, ChevronLeft, Sparkles
} from 'lucide-react';

function ProgressBar({ label, value, max, color, icon }: {
  label: string; value: number; max: number; color: string; icon: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-header">
        <span className="progress-bar-label"><span>{icon}</span>{label}</span>
        <span className="progress-bar-val">
          {formatCurrency(value)}
          <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}> ({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── BOOK INSIGHT CARD ───────────────────────────────────────── */
interface InsightPage {
  icon: React.ReactNode;
  badge: string;
  badgeType: 'warning' | 'success' | 'info';
  title: string;
  value: string;
  desc: string;
  accent: string;
  glowColor: string;
}

function BookInsightDeck({ pages }: { pages: InsightPage[] }) {
  const [current, setCurrent] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [leaving, setLeaving] = useState(false);

  const go = (dir: 'next' | 'prev') => {
    if (flipping) return;
    const next = dir === 'next'
      ? (current + 1) % pages.length
      : (current - 1 + pages.length) % pages.length;

    setDirection(dir);
    setFlipping(true);
    setLeaving(true);

    setTimeout(() => {
      setCurrent(next);
      setLeaving(false);
    }, 320);

    setTimeout(() => {
      setFlipping(false);
    }, 640);
  };

  const page = pages[current];

  const badgeColors = {
    warning: { bg: 'rgba(201,168,76,0.15)', border: 'rgba(201,168,76,0.4)', color: 'var(--gold)' },
    success: { bg: 'rgba(45,122,69,0.15)', border: 'rgba(45,122,69,0.4)', color: 'var(--accent-green)' },
    info:    { bg: 'rgba(30,95,142,0.15)', border: 'rgba(30,95,142,0.4)', color: 'var(--accent-blue)' },
  };
  const bc = badgeColors[page.badgeType];

  return (
    <div className="book-deck-wrap">
      {/* stacked pages behind */}
      <div className="book-page-shadow book-page-shadow-3" />
      <div className="book-page-shadow book-page-shadow-2" />
      <div className="book-page-shadow book-page-shadow-1" />

      {/* main page */}
      <div
        className={`book-page ${leaving ? (direction === 'next' ? 'book-page--exit-left' : 'book-page--exit-right') : 'book-page--enter'}`}
        style={{ '--page-glow': page.glowColor } as React.CSSProperties}
      >
        {/* glow orb */}
        <div className="book-page-glow" style={{ background: `radial-gradient(circle, ${page.glowColor}, transparent 70%)` }} />

        {/* page curl decoration */}
        <div className="book-page-curl" />

        {/* content */}
        <div className="book-page-header">
          <div className="book-page-icon" style={{ background: `linear-gradient(135deg, ${page.accent}22, ${page.accent}11)`, border: `1px solid ${page.accent}44` }}>
            {page.icon}
          </div>
          <span className="book-page-badge" style={{ background: bc.bg, border: `1px solid ${bc.border}`, color: bc.color }}>
            {page.badge}
          </span>
        </div>

        <div className="book-page-title">{page.title}</div>
        <div className="book-page-value" style={{ color: page.accent }}>{page.value}</div>
        <div className="book-page-desc">{page.desc}</div>

        {/* page number */}
        <div className="book-page-num">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`book-dot ${i === current ? 'book-dot--active' : ''}`}
              onClick={() => {
                if (i === current || flipping) return;
                setDirection(i > current ? 'next' : 'prev');
                setFlipping(true);
                setLeaving(true);
                setTimeout(() => { setCurrent(i); setLeaving(false); }, 320);
                setTimeout(() => setFlipping(false), 640);
              }}
              style={i === current ? { background: page.accent } : {}}
            />
          ))}
        </div>

        {/* nav arrows */}
        <button className="book-nav book-nav--prev" onClick={() => go('prev')} aria-label="Previous">
          <ChevronLeft size={18} />
        </button>
        <button className="book-nav book-nav--next" onClick={() => go('next')} aria-label="Next">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ── HERO SMART CARD ─────────────────────────────────────────── */
function HeroInsight({ totalExp, topCategory }: { totalExp: number; topCategory: { name: string; value: number } | null }) {
  return (
    <div className="hero-insight">
      <div className="hero-glow" />
      <div className="hero-content">
        <div className="hero-title">
          <Sparkles size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Smart Insight
        </div>
        <div className="hero-main">
          You spent <b>{formatCurrency(totalExp)}</b> this period
        </div>
        <div className="hero-sub">
          {topCategory
            ? <>Highest in <b>{topCategory.name}</b> — optimize this to save more</>
            : 'Add transactions to unlock insights'}
        </div>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ──────────────────────────────────────────── */
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

  /* 3D tilt */
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotX = (y / rect.height - 0.5) * -8;
    const rotY = (x / rect.width - 0.5) * 8;
    card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
  };
  const resetTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0)';
  };

  const insightPages: InsightPage[] = [
    {
      icon: <Flame size={20} style={{ color: '#C9A84C' }} />,
      badge: 'Highest Spend',
      badgeType: 'warning',
      title: 'Top Spending Category',
      value: topCategory ? topCategory.name : 'N/A',
      desc: topCategory
        ? `${formatCurrency(topCategory.value)} spent — ${totalExp > 0 ? ((topCategory.value / totalExp) * 100).toFixed(0) : 0}% of total expenses`
        : 'No expense data available',
      accent: '#C9A84C',
      glowColor: 'rgba(201,168,76,0.25)',
    },
    {
      icon: <Calendar size={20} style={{ color: '#2D7A45' }} />,
      badge: monthChange <= 0 ? '↓ Lower' : '↑ Higher',
      badgeType: monthChange <= 0 ? 'success' : 'warning',
      title: 'Monthly Comparison',
      value: `${Math.abs(monthChange).toFixed(0)}%`,
      desc: lastMonth && prevMonth
        ? `${lastMonth.name} expenses are ${monthChange > 0 ? 'higher' : 'lower'} than ${prevMonth.name} (${formatCurrency(lastMonth.expenses)} vs ${formatCurrency(prevMonth.expenses)})`
        : 'Need at least 2 months of data',
      accent: monthChange <= 0 ? '#2D7A45' : '#C9A84C',
      glowColor: monthChange <= 0 ? 'rgba(45,122,69,0.2)' : 'rgba(201,168,76,0.2)',
    },
    {
      icon: <Briefcase size={20} style={{ color: '#1E5F8E' }} />,
      badge: 'Top Source',
      badgeType: 'info',
      title: 'Primary Income Source',
      value: insights.topIncomeSource ? insights.topIncomeSource[0] : 'N/A',
      desc: insights.topIncomeSource
        ? `${formatCurrency(insights.topIncomeSource[1])} total from this source`
        : 'No income recorded',
      accent: '#1E5F8E',
      glowColor: 'rgba(30,95,142,0.2)',
    },
    {
      icon: <TrendingUp size={20} style={{ color: '#2D7A45' }} />,
      badge: stats.savingsRate >= 20 ? 'On Track' : 'Below Target',
      badgeType: stats.savingsRate >= 20 ? 'success' : 'warning',
      title: 'Savings Rate',
      value: `${stats.savingsRate}%`,
      desc: stats.savingsRate >= 20
        ? 'Great job! You are saving more than the recommended 20% of income.'
        : `Try to save at least 20% of your income. Current savings: ${formatCurrency(stats.balance)}`,
      accent: stats.savingsRate >= 20 ? '#2D7A45' : '#C9A84C',
      glowColor: 'rgba(45,122,69,0.2)',
    },
    {
      icon: <TrendingDown size={20} style={{ color: '#A0623A' }} />,
      badge: 'Monthly Avg',
      badgeType: 'info',
      title: 'Avg Monthly Expense',
      value: formatCurrency(insights.avgMonthlyExpense),
      desc: `Based on ${monthly.length} months of data. Total expenses: ${formatCurrency(totalExp)}`,
      accent: '#A0623A',
      glowColor: 'rgba(160,98,58,0.2)',
    },
    {
      icon: <Scale size={20} style={{ color: stats.balance >= 0 ? '#2D7A45' : '#C0392B' }} />,
      badge: stats.balance >= 0 ? 'Positive' : 'Negative',
      badgeType: stats.balance >= 0 ? 'success' : 'warning',
      title: 'Net Balance',
      value: formatCurrency(stats.balance),
      desc: stats.balance >= 0
        ? `You are ${formatCurrency(stats.balance)} ahead. Keep it up!`
        : `You are ${formatCurrency(Math.abs(stats.balance))} in deficit. Review expenses.`,
      accent: stats.balance >= 0 ? '#2D7A45' : '#C0392B',
      glowColor: stats.balance >= 0 ? 'rgba(45,122,69,0.2)' : 'rgba(192,57,43,0.2)',
    },
  ];

  return (
    <div>
      {/* Hero card */}
      <HeroInsight totalExp={totalExp} topCategory={topCategory} />

      {/* Book deck */}
      <BookInsightDeck pages={insightPages} />

      {/* Charts */}
      <div className="charts-grid">
        <div className="card" onMouseMove={handleMove} onMouseLeave={resetTilt} style={{ transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)', willChange: 'transform' }}>
          <div className="section-header">
            <div>
              <div className="section-title">Expense Breakdown by Category</div>
              <div className="section-sub">Where your money goes</div>
            </div>
          </div>
          {categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-title">No data</div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categories} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2D7A45" />
                      <stop offset="100%" stopColor="#C9A84C" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,200,190,0.3)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={110} />
                  <Tooltip formatter={(v: ValueType | undefined) => formatCurrency(Number(v ?? 0))} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="url(#barGradient)" />
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

        <div className="card" onMouseMove={handleMove} onMouseLeave={resetTilt} style={{ transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)', willChange: 'transform' }}>
          <div className="section-header">
            <div>
              <div className="section-title">Net Balance Trend</div>
              <div className="section-sub">Monthly net position</div>
            </div>
          </div>
          {monthly.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <div className="empty-title">No data</div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthly} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2D7A45" />
                      <stop offset="100%" stopColor="#C9A84C" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,200,190,0.3)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: ValueType | undefined) => formatCurrency(Number(v ?? 0))} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    dot={{ fill: '#C9A84C', strokeWidth: 0, r: 5 }}
                    name="Net Balance"
                  />
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
