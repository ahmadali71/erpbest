import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Menu,
  Store,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useERP } from '../context/ERPContext';

interface MobileBottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMenu,
}) => {
  const { lowStockCount } = useERP();

  const isMoreActive = ['payments', 'expenses', 'reports', 'stock_logs', 'quotations', 'suppliers'].includes(activeTab);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg select-none">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors ${
          activeTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Home</span>
      </button>

      <button
        onClick={() => setActiveTab('pos')}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors ${
          activeTab === 'pos' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Store className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">POS</span>
      </button>

      <button
        onClick={() => setActiveTab('inventory')}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors ${
          activeTab === 'inventory' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Package className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Stock</span>
        {lowStockCount > 0 && (
          <span className="absolute top-0.5 right-1/4 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      <button
        onClick={() => setActiveTab('sales')}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors ${
          activeTab === 'sales' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <ShoppingCart className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Sales</span>
      </button>

      <button
        onClick={onOpenMenu}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors ${
          isMoreActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">More</span>
      </button>
    </nav>
  );
};

