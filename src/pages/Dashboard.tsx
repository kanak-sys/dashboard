import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';
import type { BarShapeProps } from 'recharts/types/cartesian/Bar';
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

/* mini sparkline SVG path data per card type */
const SPARKLINES: Record<string, string> = {
  balance: 'M0,18 C8,16 14,10 22,8 C30,6 36,12 44,9 C52,6 58,4 66,2',
  income:  'M0,20 C8,17 14,12 22,10 C30,8 36,5 44,7 C52,9 58,3 66,1',
  expense: 'M0,5  C8,8  14,12 22,14 C30,16 36,11 44,16 C52,21 58,18 66,20',
  savings: 'M0,18 C8,15 14,10 22,9  C30,8  36,6  44,5  C52,4  58,3  66,2',
};

function Sparkline({ type, color }: { type: string; color: string }) {
  const d = SPARKLINES[type] || SPARKLINES.balance;
  return (
    <svg width="66" height="22" viewBox="0 0 66 22" fill="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spark-${type}`} x1="0" y1="0" x2="66" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={d} stroke={`url(#spark-${type})`} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Coin({ style }: { style: React.CSSProperties }) {
  return <div className="stat-coin" style={style} />;
}

function StatCard({ type, icon, label, raw, isSavings, sub, subClass }: {
  type: string; icon: string; label: string; raw: number;
  isSavings?: boolean; sub?: string; subClass?: string;
}) {
  const animated = useCountUp(raw);

  const colorMap: Record<string, string> = {
    balance: '#C9A84C',
    income:  '#2D7A45',
    expense: '#C0392B',
    savings: '#C9A84C',
  };
  const accentColor = colorMap[type] || '#C9A84C';

  return (
    <div className={`stat-card-v2 stat-card-v2--${type}`}>
      {/* ── water ripple layers ── */}
      <div className="scv2-water">
        <div className="scv2-ripple scv2-ripple-1" />
        <div className="scv2-ripple scv2-ripple-2" />
        <div className="scv2-ripple scv2-ripple-3" />
        <div className="scv2-caustic" />
      </div>

      {/* ── coin pile (bottom) ── */}
      <div className="scv2-coins">
        {[...Array(11)].map((_, i) => (
          <Coin key={i} style={{
            width:  `${18 + (i % 4) * 6}px`,
            height: `${7  + (i % 3) * 3}px`,
            left:   `${(i * 17) % 88}%`,
            bottom: `${(i % 4) * 7}px`,
            animationDelay: `${i * 0.22}s`,
            opacity: 0.55 + (i % 3) * 0.15,
          }} />
        ))}
      </div>

      {/* ── colored border glow ── */}
      <div className="scv2-border-glow" />

      {/* ── glass overlay (content lives here) ── */}
      <div className="scv2-glass">
        {/* top corner sparkle */}
        <div className="scv2-sparkle" />

        {/* icon */}
        <div className={`scv2-icon scv2-icon--${type}`}>{icon}</div>

        {/* label */}
        <div className="scv2-label">{label}</div>

        {/* value */}
        <div className={`scv2-value scv2-value--${type}`}>
          {isSavings ? `${animated}%` : `₹${animated.toLocaleString('en-IN')}`}
        </div>

        {/* sub badge + sparkline */}
        {sub && (
          <div className={`scv2-badge scv2-badge--${subClass}`}>
            <span>{sub}</span>
            <Sparkline type={type} color={accentColor} />
          </div>
        )}
      </div>
    </div>
  );
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  fill: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'rgba(27,58,45,0.92)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12,
        padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}>
        <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#F5F0E8' }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ fontSize: 12, color: p.color, fontWeight: 500 }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── CustomTooltip3D — declared outside MonthlySummaryChart to avoid react-hooks/static-components ── */
const CustomTooltip3D = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(18,38,26,0.92)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(201,168,76,0.3)', borderRadius: 14,
      padding: '12px 16px', boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
      minWidth: 160,
    }}>
      <p style={{ fontWeight: 800, marginBottom: 8, fontSize: 13, color: '#F5F0E8', letterSpacing: '-0.2px' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: p.fill, fontWeight: 600 }}>{p.name}</span>
          <span style={{ fontSize: 12, color: '#F5F0E8', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
            ₹{Number(p.value).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
};

interface Bar3DProps extends BarShapeProps {
  isActive: boolean;
}

/* ─── 3D Bar shape ──────────────────────────────────────────── */
function Bar3D(props: Bar3DProps) {
  const { x = 0, y = 0, width = 0, height = 0, fill = 'transparent', isActive } = props;
  if (!height || height <= 0) return null;
  const r = 6;
  const opacity = isActive ? 1 : 0.52;

  return (
    <g style={{ filter: isActive ? `drop-shadow(0 6px 18px ${fill}55)` : 'none', transition: 'filter 0.3s' }}>
      {/* main bar */}
      <rect x={x} y={y} width={width} height={height} rx={r} ry={r} fill={fill} opacity={opacity}
        style={{ transition: 'opacity 0.25s' }} />
      {/* top-face highlight — simulates 3D lit surface */}
      <rect x={x + 1} y={y} width={width - 2} height={Math.min(height, 10)} rx={r} ry={r}
        fill="rgba(255,255,255,0.22)" opacity={opacity} />
      {/* right-edge shadow strip — depth illusion */}
      <rect x={x + width - 4} y={y + r} width={4} height={Math.max(height - r, 0)}
        fill="rgba(0,0,0,0.12)" opacity={opacity} />
      {/* inner vertical shine line */}
      <line x1={x + 5} y1={y + r + 2} x2={x + 5} y2={y + height - 4}
        stroke="rgba(255,255,255,0.18)" strokeWidth={2} opacity={opacity} />
    </g>
  );
}

/* ─── Floating orb that travels above bars ─────────────────── */
function FloatingOrb({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <motion.div
      className="monthly-orb"
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 110, damping: 14 }}
      style={{ '--orb-color': color } as React.CSSProperties}
    >
      <motion.div
        className="monthly-orb-inner"
        animate={{ scale: [1, 1.18, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="monthly-orb-ring" />
    </motion.div>
  );
}

/* ─── Legend dot ────────────────────────────────────────────── */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
      <div style={{ width: 9, height: 9, borderRadius: 3, background: color,
        boxShadow: `0 0 6px ${color}66` }} />
      {label}
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────── */
function MonthlySummaryChart({ monthly }: { monthly: Array<{ name: string; income: number; expenses: number; balance: number }> }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [orbPos, setOrbPos] = useState({ x: 0, y: 0 });
  const [orbColor, setOrbColor] = useState('#2D7A45');
  const containerRef = useRef<HTMLDivElement>(null);

  // Track mouse over chart to move orb
  const handleMouseMove = useCallback((state: MouseHandlerDataParam) => {
    if (state?.isTooltipActive && state.activeTooltipIndex != null) {
      const idx = state.activeTooltipIndex as number;
      setActiveIdx(idx);
      // pick highest bar's color for orb
      const d = monthly[idx];
      if (!d) return;
      const maxKey = d.income >= d.balance ? 'income' : 'balance';
      setOrbColor(maxKey === 'income' ? '#2D7A45' : '#C9A84C');
      // calculate orb position from activeCoordinate
      if (state.activeCoordinate) {
        const rect = containerRef.current?.getBoundingClientRect();
        const chartArea = containerRef.current?.querySelector('.recharts-cartesian-grid');
        const areaRect = chartArea?.getBoundingClientRect();
        if (rect && areaRect) {
          const relX = (areaRect.left - rect.left) + state.activeCoordinate.x - 16;
          const relY = (areaRect.top - rect.top) - 28;
          setOrbPos({ x: relX, y: Math.max(relY, 10) });
        }
      }
    }
  }, [monthly]);

  const handleMouseLeave = useCallback(() => {
    setActiveIdx(null);
  }, []);

  return (
    <div className="monthly-chart-card" ref={containerRef}>
      {/* ambient background orbs */}
      <div className="monthly-bg-orb monthly-bg-orb-1" />
      <div className="monthly-bg-orb monthly-bg-orb-2" />
      <div className="monthly-bg-orb monthly-bg-orb-3" />

      {/* card shine */}
      <div className="monthly-card-shine" />

      {/* header */}
      <div className="section-header" style={{ position: 'relative', zIndex: 2 }}>
        <div>
          <div className="section-title">Monthly Summary</div>
          <div className="section-sub">Income, expenses & net balance per month</div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <LegendDot color="#2D7A45" label="Income" />
          <LegendDot color="#C0392B" label="Expenses" />
          <LegendDot color="#C9A84C" label="Balance" />
        </div>
      </div>

      {/* floating orb — only visible when hovering */}
      <AnimatePresence>
        {activeIdx !== null && (
          <FloatingOrb key="orb" x={orbPos.x} y={orbPos.y} color={orbColor} />
        )}
      </AnimatePresence>

      {/* chart */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {monthly.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">No data yet</div></div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={monthly}
              margin={{ top: 16, right: 16, bottom: 5, left: 10 }}
              barCategoryGap="28%"
              barGap={3}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id="incomeGrad3d" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3DAB5E" />
                  <stop offset="100%" stopColor="#1B5E35" />
                </linearGradient>
                <linearGradient id="expenseGrad3d" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#E05040" />
                  <stop offset="100%" stopColor="#8B1E14" />
                </linearGradient>
                <linearGradient id="balanceGrad3d" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#DDB84A" />
                  <stop offset="100%" stopColor="#8C6820" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                stroke="rgba(180,200,190,0.18)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }}
                axisLine={{ stroke: 'rgba(180,200,190,0.2)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
                width={46}
              />
              <Tooltip content={<CustomTooltip3D />} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 8 }} />

              <Bar dataKey="income" name="Income" maxBarSize={32}
                shape={(p: BarShapeProps) => <Bar3D {...p} fill="url(#incomeGrad3d)" isActive={activeIdx === null || activeIdx === (p.index as number)} />}
              />
              <Bar dataKey="expenses" name="Expenses" maxBarSize={32}
                shape={(p: BarShapeProps) => <Bar3D {...p} fill="url(#expenseGrad3d)" isActive={activeIdx === null || activeIdx === (p.index as number)} />}
              />
              <Bar dataKey="balance" name="Net Balance" maxBarSize={32}
                shape={(p: BarShapeProps) => <Bar3D {...p} fill="url(#balanceGrad3d)" isActive={activeIdx === null || activeIdx === (p.index as number)} />}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

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

      <MonthlySummaryChart monthly={monthly} />

      {/* ── LIQUID GLASS RECENT TRANSACTIONS ─────────────────── */}
      <div className="glass-tx-card">
        {/* ambient glow orbs — float + breathe */}
        <div className="glass-tx-orb glass-tx-orb-1" />
        <div className="glass-tx-orb glass-tx-orb-2" />
        <div className="glass-tx-orb glass-tx-orb-3" />

        {/* curved inner-edge highlight (glass thickness illusion) */}
        <div className="glass-tx-inner-edge" />

        <div className="section-header" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <div className="section-title">Recent Transactions</div>
            <div className="section-sub">Latest 5 activities</div>
          </div>
          <button className="glass-view-btn" onClick={() => useStore.getState().setActiveTab('transactions')}>
            View All →
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state" style={{ position: 'relative', zIndex: 1 }}>
            <div className="empty-icon">💳</div>
            <div className="empty-title">No transactions yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
            {recent.map((tx) => (
              <div
                key={tx.id}
                className={`glass-tx-row glass-tx-row--${tx.type}`}
              >
                {/* floating glass icon bubble */}
                <div className="glass-tx-icon-bubble">
                  {CATEGORY_ICONS[tx.category as TransactionCategory]}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 13.5,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: 'var(--text)',
                  }}>
                    {tx.description}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {tx.merchant} · {formatDate(tx.date)}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className={`glass-tx-amount glass-tx-amount--${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  <span className={`glass-type-pill glass-type-pill--${tx.type}`}>
                    {tx.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
