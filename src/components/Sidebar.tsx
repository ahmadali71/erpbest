import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Receipt,
  CreditCard,
  History,
  RotateCcw,
  ShieldCheck,
  X,
  Store,
  FileText,
  Truck,
  Radio,
  Undo2,
  Settings,
  Sliders,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';

export type NavTab =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'sales'
  | 'returns'
  | 'quotations'
  | 'clients'
  | 'suppliers'
  | 'payments'
  | 'expenses'
  | 'reports'
  | 'stock_logs'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const {
    lowStockCount,
    totalPendingReceivables,
    pendingQuotationsCount,
    orderedPOCount,
    returns,
    activeTerminals,
    resetToDemoData,
    serverStatus,
  } = useERP();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'pos' as NavTab,
      label: 'POS Register',
      icon: Store,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-600',
    },
    {
      id: 'inventory' as NavTab,
      label: 'Inventory & Products',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-red-500',
    },
    {
      id: 'sales' as NavTab,
      label: 'Sales & Invoices',
      icon: ShoppingCart,
    },
    {
      id: 'returns' as NavTab,
      label: 'Returns & Refunds',
      icon: Undo2,
      badge: returns.length > 0 ? returns.length : undefined,
      badgeColor: 'bg-rose-600',
    },
    {
      id: 'quotations' as NavTab,
      label: 'Quotes & Estimates',
      icon: FileText,
      badge: pendingQuotationsCount > 0 ? pendingQuotationsCount : undefined,
      badgeColor: 'bg-violet-600',
    },
    {
      id: 'clients' as NavTab,
      label: 'Client Directory',
      icon: Users,
    },
    {
      id: 'suppliers' as NavTab,
      label: 'Suppliers & POs',
      icon: Truck,
      badge: orderedPOCount > 0 ? orderedPOCount : undefined,
      badgeColor: 'bg-amber-600',
    },
  ];

  const financialItems = [
    {
      id: 'reports' as NavTab,
      label: 'Profit & Reports',
      icon: TrendingUp,
    },
    {
      id: 'payments' as NavTab,
      label: 'Payments & Receivables',
      icon: CreditCard,
      badge: totalPendingReceivables > 0 ? `$${Math.round(totalPendingReceivables)}` : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'expenses' as NavTab,
      label: 'Expense Tracker',
      icon: Receipt,
    },
    {
      id: 'stock_logs' as NavTab,
      label: 'Stock Movement Logs',
      icon: History,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings & Config',
      icon: Settings,
    },
  ];


  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--accent-color)] rounded-xl flex items-center justify-center shadow-sm text-white font-black text-base">
            <span className="tracking-tighter">N</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Nexus<span className="text-[var(--accent-color)] font-black">ERP</span>
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] rounded-md border border-[var(--accent-color)]/20">
                v2.4
              </span>
            </div>
            <span className="block text-[11px] text-slate-400 font-medium">
              Enterprise Suite
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mt-1.5 mb-1.5">
          Core Operations
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 text-left ${
                isActive
                  ? 'bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--accent-color)] rounded-r-full" />
              )}
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[var(--accent-color)] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="tracking-tight">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-[10px] text-white font-extrabold rounded-full shadow-2xs ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="mt-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
          Financials & Logs
        </div>
        {financialItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 text-left ${
                isActive
                  ? 'bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--accent-color)] rounded-r-full" />
              )}
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[var(--accent-color)] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="tracking-tight">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-[10px] text-white font-extrabold rounded-full shadow-2xs ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Backend & Admin User Footer */}
      <div className="p-3 border-t border-slate-100 flex flex-col gap-2 bg-slate-50/60">
        <button
          onClick={() => {
            if (window.confirm('Reset all ERP data to default demonstration sample state?')) {
              resetToDemoData();
              if (onCloseMobile) onCloseMobile();
            }
          }}
          className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors w-full"
          title="Reset database to initial demo state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>

        <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-color)] text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
            AD
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold text-slate-900 truncate">Administrator</p>
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-color)] inline" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  serverStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {serverStatus === 'connected' ? 'Live Express API' : 'Local Fallback'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile/tablet) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0 h-screen select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
