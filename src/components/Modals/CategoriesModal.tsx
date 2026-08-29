import React, { useState } from 'react';
import { X, Tag, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, deleteCategory, products } = useERP();

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      setError('A category with this name already exists.');
      return;
    }

    addCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim() || undefined,
    });

    setNewCatName('');
    setNewCatDesc('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--accent-color)] rounded-lg flex items-center justify-center text-white">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Manage Product Categories</h3>
              <p className="text-xs text-slate-400">Organize products into distinct department classifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Create New Category</h4>

            {error && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="Category name (e.g. Peripherals, Office Furniture)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-[var(--accent-color)]"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Optional description"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[var(--accent-color)]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Existing Categories ({categories.length})
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat.name).length;
                return (
                  <div key={cat.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{cat.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {cat.description || 'No description'} • <strong className="text-slate-600">{count} products</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (count > 0) {
                          alert(`Cannot delete category "${cat.name}" because it currently has ${count} products assigned.`);
                          return;
                        }
                        if (window.confirm(`Delete category "${cat.name}"?`)) {
                          deleteCategory(cat.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
