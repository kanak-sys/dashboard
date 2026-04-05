import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, Plus, Trash2, Pencil,
  TrendingUp, TrendingDown, Calendar, Tag, LayoutList,
  Clock, X, ChevronUp, ChevronDown, ChevronsUpDown,
  FileJson, FileText, BarChart2,
  ShoppingBag, Utensils, Car, Tv, Zap, Heart,
  BookOpen, Briefcase, Laptop, CircleDollarSign,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  getFilteredTransactions, formatCurrency, formatDate, CATEGORY_COLORS,
} from '../utils/helpers';
import type { Transaction, TransactionCategory } from '../types';
import TransactionModal from '../components/TransactionModal';
import { format, parseISO } from 'date-fns';

type FilterType     = 'All' | 'income' | 'expense';
type FilterCategory = TransactionCategory | 'All';
type FilterSortBy   = 'date' | 'amount' | 'category';

/* ── category icon map (lucide stroke, no emojis) ───────────── */
const CAT_ICON: Record<TransactionCategory, React.ReactNode> = {
  'Food & Dining':  <Utensils size={15} strokeWidth={1.8} />,
  'Shopping':       <ShoppingBag size={15} strokeWidth={1.8} />,
  'Transport':      <Car size={15} strokeWidth={1.8} />,
  'Entertainment':  <Tv size={15} strokeWidth={1.8} />,
  'Utilities':      <Zap size={15} strokeWidth={1.8} />,
  'Healthcare':     <Heart size={15} strokeWidth={1.8} />,
  'Education':      <BookOpen size={15} strokeWidth={1.8} />,
  'Salary':         <Briefcase size={15} strokeWidth={1.8} />,
  'Freelance':      <Laptop size={15} strokeWidth={1.8} />,
  'Investment':     <BarChart2 size={15} strokeWidth={1.8} />,
  'Other':          <CircleDollarSign size={15} strokeWidth={1.8} />,
};

const CATEGORIES: TransactionCategory[] = [
  'Food & Dining','Shopping','Transport','Entertainment',
  'Utilities','Healthcare','Education','Salary','Freelance','Investment','Other',
];

/* ── export ────────────────────────────────────────────────── */
const dl = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
};
const exportCSV  = (txs: Transaction[]) => dl(new Blob([
  [['Date','Description','Merchant','Category','Type','Amount'],
   ...txs.map(t=>[t.date,t.description,t.merchant||'',t.category,t.type,t.amount])]
  .map(r=>r.join(',')).join('\n')], { type:'text/csv' }), 'transactions.csv');
const exportJSON = (txs: Transaction[]) => dl(
  new Blob([JSON.stringify(txs,null,2)], { type:'application/json' }), 'transactions.json');

/* ── mini sparkline ─────────────────────────────────────────── */
function Spark({ vals, color }: { vals: number[]; color: string }) {
  if (vals.length < 2) return null;
  const max = Math.max(...vals), min = Math.min(...vals), range = max - min || 1;
  const W = 54, H = 20;
  const pts = vals.map((v,i) =>
    `${(i/(vals.length-1))*W},${H-((v-min)/range)*H}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

/* ── summary pill ───────────────────────────────────────────── */
function Pill({ label, value, color, icon, spark }:
  { label:string; value:string; color:string; icon:React.ReactNode; spark:number[] }) {
  return (
    <div className="tx-summary-pill">
      <div className="tx-summary-pill__icon" style={{ color }}>{icon}</div>
      <div className="tx-summary-pill__body">
        <div className="tx-summary-pill__label">{label}</div>
        <div className="tx-summary-pill__value" style={{ color }}>{value}</div>
      </div>
      <div className="tx-summary-pill__spark"><Spark vals={spark} color={color} /></div>
    </div>
  );
}

/* ── sort icon ──────────────────────────────────────────────── */
function SortIco({ active, order }: { active: boolean; order: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown size={11} style={{ opacity:0.3 }} />;
  return order === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
}

type View = 'timeline' | 'table';

/* ═══════════════════════════════════════════════════════════════ */
export default function Transactions() {
  const { transactions, filters, setFilters, deleteTransaction, role, resetFilters } = useStore();
  const [modal, setModal]     = useState(false);
  const [editTx, setEditTx]   = useState<Transaction|undefined>();
  const [delId,  setDelId]    = useState<string|null>(null);
  const [view,   setView]     = useState<View>('timeline');
  const [showF,  setShowF]    = useState(false);

  const filtered = getFilteredTransactions(transactions, filters);
  const income   = filtered.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense  = filtered.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);

  const sparkInc  = filtered.filter(t=>t.type==='income').slice(-8).map(t=>t.amount);
  const sparkExp  = filtered.filter(t=>t.type==='expense').slice(-8).map(t=>t.amount);
  const sparkAll  = filtered.slice(-8).map(t=>t.type==='income'?t.amount:-t.amount);

  const grouped = useMemo(() => {
    const snapshot = filtered.slice();
    const map: Record<string, Transaction[]> = {};
    snapshot.sort((a, b) => b.date.localeCompare(a.date)).forEach(tx => {
      const k = format(parseISO(tx.date), 'MMMM yyyy');
      (map[k] = map[k] || []).push(tx);
    });
    return Object.entries(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, transactions, filters]);

  const hasF = !!(filters.search || filters.category!=='All' ||
    filters.type!=='All' || filters.dateRange.start || filters.dateRange.end);

  function sort(col: 'date'|'amount'|'category') {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    filters.sortBy===col
      ? setFilters({ sortOrder: filters.sortOrder==='asc'?'desc':'asc' })
      : setFilters({ sortBy: col, sortOrder: 'desc' });
  }


  return (
    <div className="tx-page">

      {/* ─── TOP BAR ───────────────────────────────────────── */}
      <div className="tx-topbar">
        <div className="tx-search-wrap">
          <Search size={15} className="tx-search-icon" />
          <input
            className="tx-search-input"
            placeholder="Search by merchant, category, description…"
            value={filters.search}
            onChange={e => setFilters({ search: e.target.value })}
          />
          {filters.search && (
            <button className="tx-search-clear" onClick={()=>setFilters({search:''})}>
              <X size={13}/>
            </button>
          )}
        </div>

        <div className="tx-topbar-actions">
          {/* filter toggle */}
          <button
            className={`tx-icon-btn${showF||hasF?' tx-icon-btn--active':''}`}
            onClick={()=>setShowF(s=>!s)} title="Filters"
          >
            <SlidersHorizontal size={15}/>
            {hasF && <span className="tx-filter-dot"/>}
          </button>

          {/* view mode */}
          <div className="tx-view-toggle">
            <button className={`tx-view-btn${view==='timeline'?' active':''}`} onClick={()=>setView('timeline')} title="Timeline">
              <Clock size={13}/> Timeline
            </button>
            <button className={`tx-view-btn${view==='table'?' active':''}`} onClick={()=>setView('table')} title="Table">
              <LayoutList size={13}/> Table
            </button>
          </div>

          {/* export — admin only */}
          {role==='admin' && (
            <div className="tx-export-group">
              <button className="tx-icon-btn" onClick={()=>exportCSV(filtered)} title="Export CSV"><FileText size={14}/></button>
              <button className="tx-icon-btn" onClick={()=>exportJSON(filtered)} title="Export JSON"><FileJson size={14}/></button>
            </div>
          )}

          {/* add — admin only */}
          {role==='admin' && (
            <button className="tx-add-btn" onClick={()=>{setEditTx(undefined);setModal(true);}}>
              <Plus size={14}/> Add
            </button>
          )}
        </div>
      </div>

      {/* ─── FILTER PANEL ──────────────────────────────────── */}
      <AnimatePresence>
        {showF && (
          <motion.div className="tx-filter-panel"
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }} transition={{ duration:0.22 }}>
            <div className="tx-filter-row">
              <div className="tx-filter-group">
                <label className="tx-filter-label">Type</label>
                <select className="tx-filter-select" value={filters.type}
                  onChange={e => setFilters({ type: e.target.value as FilterType })}>                  <option value="All">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="tx-filter-group">
                <label className="tx-filter-label">Category</label>
                <select className="tx-filter-select" value={filters.category}
                  onChange={e => setFilters({ category: e.target.value as FilterCategory })}>                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="tx-filter-group">
                <label className="tx-filter-label">Sort by</label>
                <select className="tx-filter-select" value={filters.sortBy}
                  onChange={e => setFilters({ sortBy: e.target.value as FilterSortBy })}>                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="category">Category</option>
                </select>
              </div>
              <div className="tx-filter-group">
                <label className="tx-filter-label">From</label>
                <input type="date" className="tx-filter-select" value={filters.dateRange.start}
                  onChange={e=>setFilters({dateRange:{...filters.dateRange,start:e.target.value}})}/>
              </div>
              <div className="tx-filter-group">
                <label className="tx-filter-label">To</label>
                <input type="date" className="tx-filter-select" value={filters.dateRange.end}
                  onChange={e=>setFilters({dateRange:{...filters.dateRange,end:e.target.value}})}/>
              </div>
              <button className="tx-reset-btn" onClick={resetFilters}><X size={12}/> Reset</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SUMMARY PILLS ─────────────────────────────────── */}
      <div className="tx-summary-row">
        <Pill label="Transactions" value={String(filtered.length)}
          color="var(--gold)" icon={<Tag size={15} strokeWidth={1.8}/>}
          spark={filtered.slice(-8).map(t=>t.amount)} />
        <Pill label="Total Income" value={`+${formatCurrency(income)}`}
          color="var(--accent-green)" icon={<TrendingUp size={15} strokeWidth={1.8}/>}
          spark={sparkInc.length?sparkInc:[0,0]} />
        <Pill label="Total Expenses" value={`-${formatCurrency(expense)}`}
          color="var(--accent-red)" icon={<TrendingDown size={15} strokeWidth={1.8}/>}
          spark={sparkExp.length?sparkExp:[0,0]} />
        <Pill label="Net Balance"
          value={formatCurrency(income-expense)}
          color={income>=expense?'var(--accent-green)':'var(--accent-red)'}
          icon={<BarChart2 size={15} strokeWidth={1.8}/>}
          spark={sparkAll.length?sparkAll:[0,0]} />
      </div>

      {/* ─── MAIN CONTENT ──────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="tx-empty">
          <div className="tx-empty-icon"><Search size={38} strokeWidth={1}/></div>
          <div className="tx-empty-title">No transactions found</div>
          <div className="tx-empty-desc">Try adjusting filters or add a new transaction</div>
          {hasF && (
            <button className="tx-add-btn" style={{marginTop:18}} onClick={resetFilters}>
              <X size={13}/> Clear filters
            </button>
          )}
        </div>

      ) : view === 'timeline' ? (

        /* ──── TIMELINE ──────────────────────────────────── */
        <div className="tx-timeline">
          {grouped.map(([month, txs], gi) => (
            <div key={month} className="tx-timeline-group">

              {/* month header */}
              <div className="tx-timeline-month">
                <span className="tx-timeline-month-label">
                  <Calendar size={11} strokeWidth={2} style={{ opacity: 0.6 }} />
                  {month}
                </span>
                <div className="tx-timeline-month-line" />
                <span className="tx-timeline-month-count">{txs.length} tx</span>
              </div>

              <div className="glass-tx-card">
                {/* background glow orbs */}
                <div className="glass-tx-orb glass-tx-orb-1" />
                <div className="glass-tx-orb glass-tx-orb-2" />
                <div className="glass-tx-orb glass-tx-orb-3" />
                {/* cards */}
                <div className="tx-timeline-cards">
                  {txs.map((tx, i) => (
                    <motion.div
                      key={tx.id}
                      className={`glass-tx-row glass-tx-row--${tx.type}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(gi * 0.04 + i * 0.03, 0.4), duration: 0.28 }}
                      layout
                    >
                      {/* glass icon bubble */}
                      <div className="glass-tx-icon-bubble"
                        style={{
                          background: `${CATEGORY_COLORS[tx.category]}16`,
                          color: CATEGORY_COLORS[tx.category],
                        }}>
                        {CAT_ICON[tx.category]}
                      </div>

                      {/* body */}
                      <div className="tx-card-body">
                        <div className="tx-card-merchant">{tx.merchant || tx.description}</div>
                        <div className="tx-card-meta">
                          <span className="tx-card-cat-pill"
                            style={{
                              color: CATEGORY_COLORS[tx.category],
                              background: `${CATEGORY_COLORS[tx.category]}14`,
                            }}>
                            {CAT_ICON[tx.category]}
                            {tx.category}
                          </span>
                          <span className="tx-card-dot">·</span>
                          <span className="tx-card-date">{formatDate(tx.date)}</span>
                        </div>
                      </div>

                      {/* right */}
                      <div className="tx-card-right">
                        <div className={`glass-tx-amount glass-tx-amount--${tx.type}`}>
                          {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                        </div>
                        <span className={`glass-type-pill glass-type-pill--${tx.type}`}>
                          {tx.type === 'income'
                            ? <TrendingUp size={9} strokeWidth={2.5} />
                            : <TrendingDown size={9} strokeWidth={2.5} />}
                          {tx.type}
                        </span>
                        {role === 'admin' && (
                          <div className="tx-card-actions">
                            <button className="tx-card-act-btn" title="Edit"
                              onClick={() => { setEditTx(tx); setModal(true); }}>
                              <Pencil size={11} strokeWidth={2} />
                            </button>
                            <button className="tx-card-act-btn tx-card-act-btn--del" title="Delete"
                              onClick={() => setDelId(tx.id)}>
                              <Trash2 size={11} strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>

      ) : (

        /* ──── TABLE ─────────────────────────────────────── */
        <div className="tx-table-wrap">
          <div className="tx-table-header">
            <span className="tx-count">
              Showing <strong>{filtered.length}</strong> of <strong>{transactions.length}</strong> transactions
            </span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="tx-table">
              <thead>
                <tr>
                  <th onClick={()=>sort('date')} className="tx-th-sortable">
                    Date <SortIco active={filters.sortBy==='date'} order={filters.sortOrder}/>
                  </th>
                  <th>Description</th>
                  <th onClick={()=>sort('category')} className="tx-th-sortable">
                    Category <SortIco active={filters.sortBy==='category'} order={filters.sortOrder}/>
                  </th>
                  <th>Type</th>
                  <th onClick={()=>sort('amount')} className="tx-th-sortable">
                    Amount <SortIco active={filters.sortBy==='amount'} order={filters.sortOrder}/>
                  </th>
                  {role==='admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx,i)=>(
                  <motion.tr key={tx.id}
                    initial={{opacity:0}} animate={{opacity:1}}
                    transition={{delay:Math.min(i*0.02,0.3)}}>
                    <td className="tx-td-date">{formatDate(tx.date)}</td>
                    <td>
                      <div className="tx-merchant">{tx.merchant||tx.description}</div>
                      <div className="tx-desc">{tx.description}</div>
                    </td>
                    <td>
                      <span className="tx-cat-badge"
                        style={{color:CATEGORY_COLORS[tx.category], background:`${CATEGORY_COLORS[tx.category]}16`}}>
                        <span style={{display:'flex',alignItems:'center'}}>{CAT_ICON[tx.category]}</span>
                        {tx.category}
                      </span>
                    </td>
                    <td>
                      <span className={`tx-type-pill tx-type-pill--${tx.type}`}>
                        {tx.type==='income'
                          ?<TrendingUp size={9} strokeWidth={2.5}/>
                          :<TrendingDown size={9} strokeWidth={2.5}/>}
                        {tx.type}
                      </span>
                    </td>
                    <td>
                      <span className={`tx-amount-val tx-amount-val--${tx.type}`}>
                        {tx.type==='income'?'+':'−'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    {role==='admin' && (
                      <td>
                        <div className="row-actions">
                          <button className="action-btn" onClick={()=>{setEditTx(tx);setModal(true);}}>
                            <Pencil size={12} strokeWidth={2}/>
                          </button>
                          <button className="action-btn delete" onClick={()=>setDelId(tx.id)}>
                            <Trash2 size={12} strokeWidth={2}/>
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TRANSACTION MODAL ─────────────────────────────── */}
      {modal && (
        <TransactionModal tx={editTx} onClose={()=>{setModal(false);setEditTx(undefined);}}/>
      )}

      {/* ─── DELETE CONFIRM ────────────────────────────────── */}
      <AnimatePresence>
        {delId && (
          <motion.div className="modal-overlay"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setDelId(null)}>
            <motion.div className="modal" style={{maxWidth:360}}
              initial={{scale:0.90,opacity:0,y:20}}
              animate={{scale:1,opacity:1,y:0}}
              exit={{scale:0.90,opacity:0,y:-4}}
              transition={{type:'spring',stiffness:280,damping:22}}
              onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title" style={{display:'flex',alignItems:'center',gap:8}}>
                  <Trash2 size={17} style={{color:'var(--accent-red)'}}/>
                  Delete Transaction
                </h2>
                <button className="modal-close" onClick={()=>setDelId(null)}><X size={14}/></button>
              </div>
              <p style={{fontSize:14,color:'var(--text-muted)',marginBottom:24,lineHeight:1.65}}>
                This action is permanent and cannot be undone.
              </p>
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={()=>setDelId(null)}>Cancel</button>
                <button className="btn btn-danger"
                  onClick={()=>{deleteTransaction(delId);setDelId(null);}}>
                  <Trash2 size={12}/> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
