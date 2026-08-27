import React, { useState, useMemo } from 'react';
import {
  Plus,
  Receipt,
  Search,
  PieChart as PieIcon,
  Trash2,
  ArrowDownRight,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface ExpensesViewProps {
  onOpenAddExpense: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenAddExpense }) => {
  const { expenses, deleteExpense, totalExpenses } = useERP();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const categories = [
    'Rent',
    'Utilities',
    'Salaries',
    'Marketing',
    'Logistics',
    'Maintenance',
    'Software',
    'Other',
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.reference && e.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  // Category breakdown for summary
  const categoryStats = useMemo(() => {
    const map: { [cat: string]: number } = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      pct: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpenses]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Operating Expenses</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalExpenses)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{expenses.length} Expense Vouchers</p>
          </div>
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Top Expense Category</p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {categoryStats[0]?.name || 'N/A'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {categoryStats[0] ? `${formatCurrency(categoryStats[0].amount)} (${categoryStats[0].pct}%)` : '$0'}
            </p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <PieIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Expense Types</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{categories.length} Categories</h3>
            <p className="text-xs text-slate-500 mt-0.5">Deducted from Gross Profit</p>
          </div>
          <button
            onClick={onOpenAddExpense}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 sm:w-64 md:w-80 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses by title or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 self-stretch sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Expense</span>
        </button>
      </div>

      {/* Expenses Mobile Cards (< lg) and Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Expenses List */}
        <div className="lg:col-span-2 space-y-3">
          {/* Mobile Card List (< md) */}
          <div className="md:hidden space-y-3">
            {filteredExpenses.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
                <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No expenses found matching criteria.
              </div>
            ) : (
              filteredExpenses.map(expense => {
                const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={expense.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{expense.title}</h4>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{formattedDate}</span>
                          {expense.reference && <span>• Ref: {expense.reference}</span>}
                        </div>
                      </div>
                      <span className="font-mono text-base font-bold text-red-600">
                        -{formatCurrency(expense.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                          {expense.category}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                          {expense.paymentMethod}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete expense "${expense.title}"?`)) {
                            deleteExpense(expense.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Operational Expense Logs</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-5 py-3 border-b border-slate-100">Date</th>
                    <th className="px-5 py-3 border-b border-slate-100">Title / Reference</th>
                    <th className="px-5 py-3 border-b border-slate-100">Category</th>
                    <th className="px-5 py-3 border-b border-slate-100">Method</th>
                    <th className="px-5 py-3 border-b border-slate-100 font-bold text-red-600">Amount</th>
                    <th className="px-5 py-3 border-b border-slate-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                        <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No expenses found for this category.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(expense => {
                      const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900">{expense.title}</div>
                            {expense.reference && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Ref: {expense.reference}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                              {expense.paymentMethod}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-red-600">
                            -{formatCurrency(expense.amount)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete expense "${expense.title}"?`)) {
                                  deleteExpense(expense.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Category Breakdown Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Expenses by Category</h3>
            <p className="text-xs text-slate-400">Distribution of company overhead</p>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {categoryStats.map(stat => (
              <div key={stat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">{stat.name}</span>
                  <div className="font-mono">
                    <span className="font-semibold text-slate-900">{formatCurrency(stat.amount)}</span>
                    <span className="text-slate-400 ml-1.5 text-[11px]">({stat.pct}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${stat.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
