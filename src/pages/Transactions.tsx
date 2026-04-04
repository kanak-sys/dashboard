import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getFilteredTransactions, formatCurrency, formatDate, CATEGORY_ICONS, CATEGORY_COLORS } from '../utils/helpers';
import type { Transaction, TransactionCategory } from '../types';
import TransactionModal from '../components/TransactionModal';

const CATEGORIES: TransactionCategory[] = [
  'Food & Dining','Shopping','Transport','Entertainment',
  'Utilities','Healthcare','Education','Salary','Freelance','Investment','Other'
];

function exportCSV(transactions: Transaction[]) {
  const headers = ['Date', 'Description', 'Merchant', 'Category', 'Type', 'Amount'];
  const rows = transactions.map(t => [t.date, t.description, t.merchant || '', t.category, t.type, t.amount]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(transactions: Transaction[]) {
  const json = JSON.stringify(transactions, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'transactions.json'; a.click();
  URL.revokeObjectURL(url);
}

export default function Transactions() {
  const { transactions, filters, setFilters, deleteTransaction, role, resetFilters } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = getFilteredTransactions(transactions, filters);

  function handleSort(col: 'date' | 'amount' | 'category') {
    if (filters.sortBy === col) {
      setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      setFilters({ sortBy: col, sortOrder: 'desc' });
    }
  }

  function sortIndicator(col: string) {
    if (filters.sortBy !== col) return ' ↕';
    return filters.sortOrder === 'asc' ? ' ↑' : ' ↓';
  }

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="transactions-page">
      <div className="filters-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={e => setFilters({ search: e.target.value })}
          />
        </div>

        <select className="filter-select" value={filters.type} onChange={e => setFilters({ type: e.target.value as any })}>
          <option value="All">All Types</option>
          <option value="income">📈 Income</option>
          <option value="expense">📉 Expense</option>
        </select>

        <select className="filter-select" value={filters.category} onChange={e => setFilters({ category: e.target.value as any })}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" className="filter-select" style={{ minWidth: 130 }} value={filters.dateRange.start}
            onChange={e => setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })} />
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>to</span>
          <input type="date" className="filter-select" style={{ minWidth: 130 }} value={filters.dateRange.end}
            onChange={e => setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })} />
        </div>

        <div className="filter-actions">
          <button className="btn btn-ghost" onClick={resetFilters}>Reset</button>
          {role === 'admin' && (
            <button className="btn btn-primary" onClick={() => { setEditTx(undefined); setShowModal(true); }}>
              ➕ Add Transaction
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 180, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filtered Results</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{filtered.length} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>transactions</span></div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Income (filtered)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-green)', marginTop: 4, fontFamily: "'Instrument Serif', serif" }}>+{formatCurrency(totalIncome)}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expenses (filtered)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-red)', marginTop: 4, fontFamily: "'Instrument Serif', serif" }}>-{formatCurrency(totalExpense)}</div>
        </div>
        {role === 'admin' && (
          <div className="card" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Export</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(filtered)}>📄 CSV</button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportJSON(filtered)}>📦 JSON</button>
            </div>
          </div>
        )}
      </div>

      <div className="tx-table-wrap">
        <div className="tx-table-header">
          <div className="tx-count">Showing <strong>{filtered.length}</strong> of <strong>{transactions.length}</strong> transactions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No transactions found</div>
            <div className="empty-desc">Try adjusting your filters or add a new transaction</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('date')}>Date{sortIndicator('date')}</th>
                  <th>Description</th>
                  <th onClick={() => handleSort('category')}>Category{sortIndicator('category')}</th>
                  <th>Type</th>
                  <th onClick={() => handleSort('amount')}>Amount{sortIndicator('amount')}</th>
                  {role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id}>
                    <td className="tx-date">{formatDate(tx.date)}</td>
                    <td>
                      <div className="tx-merchant">{tx.merchant || tx.description}</div>
                      <div className="tx-desc">{tx.description}</div>
                    </td>
                    <td>
                      <span className="category-badge" style={{ color: CATEGORY_COLORS[tx.category] }}>
                        {CATEGORY_ICONS[tx.category]} {tx.category}
                      </span>
                    </td>
                    <td><span className={`type-pill ${tx.type}`}>{tx.type}</span></td>
                    <td>
                      <span className={`tx-amount ${tx.type}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    {role === 'admin' && (
                      <td>
                        <div className="row-actions">
                          <button className="action-btn" title="Edit" onClick={() => { setEditTx(tx); setShowModal(true); }}>✏️</button>
                          <button className="action-btn delete" title="Delete" onClick={() => setConfirmDelete(tx.id)}>🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <TransactionModal tx={editTx} onClose={() => { setShowModal(false); setEditTx(undefined); }} />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🗑️ Delete Transaction</h2>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
              Are you sure? This action cannot be undone.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { deleteTransaction(confirmDelete); setConfirmDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
