import React from 'react';
import {
  Search,
  Plus,
  AlertCircle,
  Menu,
  RefreshCw,
  Radio,
  Bell,
  Volume2,
  VolumeX,
  X,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';

interface HeaderProps {
  onOpenNewSale: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenRestock?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenLiveFeed?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewSale,
  searchQuery,
  setSearchQuery,
  onToggleMobileMenu,
  onOpenLiveFeed,
}) => {
  const {
    lowStockCount,
    serverStatus,
    refreshData,
    isLoading,
    activeTerminals,
    activities,
    activeToast,
    dismissToast,
    soundEnabled,
    toggleSound,
  } = useERP();

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 z-10 select-none">
        {/* Left side: Mobile menu toggle + Global search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Open menu"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items, clients, invoices, orders..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-8 py-2 bg-slate-100/80 border border-slate-200/60 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 outline-none transition-all duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Right side: Real-Time presence, Audio toggle, Activity Bell & CTAs */}
        <div className="flex items-center gap-2 sm:gap-3 ml-2">
          {/* Real-time live presence badge */}
          <div
            onClick={onOpenLiveFeed}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs font-bold text-emerald-800 cursor-pointer hover:bg-emerald-100/90 transition-all shadow-2xs hover:scale-[1.02]"
            title="Real-Time Sync Active across all devices"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-extrabold tracking-tight">Sync Active ({activeTerminals})</span>
          </div>

          {/* Sound audio toggle */}
          <button
            onClick={toggleSound}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors hidden sm:flex"
            title={soundEnabled ? 'Mute transaction sound' : 'Enable transaction sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Live Activity Feed Bell */}
          <button
            onClick={onOpenLiveFeed}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Open Live Activity Feed"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {activities.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-extrabold text-white ring-2 ring-white">
                {activities.length > 9 ? '9+' : activities.length}
              </span>
            )}
          </button>

          {/* Low Stock Warning */}
          {lowStockCount > 0 && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-700 font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{lowStockCount} Low</span>
            </div>
          )}

          {/* Manual Sync */}
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="hidden sm:flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 text-xs transition-colors"
            title="Refresh database snapshot"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline text-[11px] font-bold">
              {isLoading ? 'Syncing...' : 'Sync'}
            </span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer whitespace-nowrap hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden xs:inline">New Sale</span>
          </button>
        </div>
      </header>

      {/* Floating Real-Time Activity Toast Banner */}
      {activeToast && (
        <div className="fixed top-18 right-4 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-top-3 duration-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">{activeToast.title}</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500 text-white rounded">LIVE</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate">{activeToast.description}</p>
            </div>
          </div>

          <button
            onClick={dismissToast}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

