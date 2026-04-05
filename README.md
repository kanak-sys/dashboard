# FinTrack – Finance Dashboard

A clean, interactive, and fully-featured finance dashboard built with **React + TypeScript + Vite**.

## 🚀 Quick Start

```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)
https://dashboard-beta-one-88.vercel.app/

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 + TypeScript | UI with type safety |
| Vite | Fast dev server & build |
| Zustand | Global state management |
| Recharts | Responsive charts |
| date-fns | Date formatting |
| localStorage | Data persistence |

---

## ✅ Features

### Dashboard Overview
- 4 Summary Cards: Balance, Income, Expenses, Savings Rate
- Area Chart: Monthly income vs expenses
- Donut Chart: Spending by category
- Grouped Bar Chart: Monthly summary
- Recent Transactions list

### Transactions
- Search, filter by type/category/date range
- Sort by date, amount, category
- Add / Edit / Delete (Admin only)
- Export CSV & JSON (Admin only)

### Role-Based UI
- **Viewer**: Read-only access
- **Admin**: Full CRUD + export
- Switch via top-right dropdown

### Insights
- Top spending category
- Month-over-month comparison
- Primary income source
- Savings rate analysis
- Category breakdown with progress bars
- Net balance trend chart

### Other
- Dark mode (persisted)
- Responsive design (mobile/tablet/desktop)
- Empty state handling
- Form validation
- Data persisted to localStorage

---

## 📁 Structure

```
src/
├── components/   Sidebar, TopBar, TransactionModal
├── data/         50 mock transactions
├── pages/        Dashboard, Transactions, Insights
├── store/        Zustand store
├── types/        TypeScript interfaces
└── utils/        Data helpers & formatters
```

---

## Setup

```bash
npm install    # Install deps
npm run dev    # Dev server at localhost:5173
npm run build  # Production build
```

**Requires**: Node.js 18+
