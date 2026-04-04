import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Transaction, TransactionCategory, TransactionType } from '../types';

const CATEGORIES: TransactionCategory[] = [
  'Food & Dining','Shopping','Transport','Entertainment',
  'Utilities','Healthcare','Education','Salary','Freelance','Investment','Other'
];

interface Props {
  tx?: Transaction;
  onClose: () => void;
}

export default function TransactionModal({ tx, onClose }: Props) {
  const { addTransaction, updateTransaction } = useStore();
  const isEdit = !!tx;

  const [form, setForm] = useState({
    description: tx?.description || '',
    merchant: tx?.merchant || '',
    amount: tx?.amount?.toString() || '',
    category: tx?.category || 'Food & Dining' as TransactionCategory,
    type: tx?.type || 'expense' as TransactionType,
    date: tx?.date || new Date().toISOString().split('T')[0],
  });

  const [error, setError] = useState('');

  function handleSubmit() {
    if (!form.description.trim()) { setError('Description is required'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!form.date) { setError('Date is required'); return; }
    
    const data = {
      description: form.description.trim(),
      merchant: form.merchant.trim() || form.description.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      type: form.type,
      date: form.date,
    };

    if (isEdit && tx) {
      updateTransaction(tx.id, data);
    } else {
      addTransaction(data);
    }
    onClose();
  }

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '✏️ Edit Transaction' : '➕ Add Transaction'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <input className="form-input" placeholder="e.g. Lunch at restaurant" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Merchant / Source</label>
          <input className="form-input" placeholder="e.g. Zomato" value={form.merchant} onChange={e => set('merchant', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" min="1" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Type *</label>
            <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="income">📈 Income</option>
              <option value="expense">📉 Expense</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--accent-red)', marginBottom: 4 }}>
            ⚠️ {error}
          </div>
        )}

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {isEdit ? '💾 Save Changes' : '➕ Add Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}
