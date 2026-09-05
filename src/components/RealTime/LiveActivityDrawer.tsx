import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  X,
  Radio,
  Volume2,
  VolumeX,
  Trash2,
  Users,
  Clock,
  Sparkles,
  ArrowUpRight,
  Package,
  ShoppingCart,
  Receipt,
  CreditCard,
  Building2,
  FileText,
} from 'lucide-react';
import { RealTimeActivity } from '../../types/erp';

interface LiveActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveActivityDrawer: React.FC<LiveActivityDrawerProps> = ({ isOpen, onClose }) => {
  const {
    activities,
    clearActivities,
    activeTerminals,
    lastSynced,
    serverStatus,
    soundEnabled,
    toggleSound,
  } = useERP();

  if (!isOpen) return null;

  const getActivityIcon = (type: RealTimeActivity['type']) => {
    switch (type) {
      case 'SALE_CREATED':
        return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
      case 'PAYMENT_RECORDED':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'STOCK_RESTOCKED':
      case 'STOCK_ADJUSTED':
      case 'PRODUCT_CREATED':
      case 'PRODUCT_UPDATED':
        return <Package className="w-4 h-4 text-[var(--accent-color)]" />;
      case 'EXPENSE_ADDED':
        return <Receipt className="w-4 h-4 text-red-600" />;
      case 'PO_CREATED':
      case 'PO_RECEIVED':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'QUOTATION_CREATED':
      case 'QUOTATION_CONVERTED':
        return <FileText className="w-4 h-4 text-violet-600" />;
      default:
        return <Radio className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Live Activity Feed</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  REAL-TIME
                </span>
              </div>
              <p className="text-xs text-slate-500">Live SSE events stream across all terminals</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Status Card */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Connected Terminals:</span>
                <span className="px-2 py-0.5 text-xs font-black bg-emerald-500 text-slate-950 rounded-full shadow-xs">
                  {activeTerminals} Active
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Last Synced: {lastSynced}</span>
            </div>
          </div>

          <button
            onClick={toggleSound}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
            title={soundEnabled ? 'Mute transaction sound' : 'Unmute transaction sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime On' : 'Muted'}</span>
          </button>
        </div>

        {/* Events List */}
        <div className="flex-1 p-4 overflow-y-auto divide-y divide-slate-100 space-y-3">
          {activities.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Radio className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700 text-sm">Listening for live system events...</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Any sale, inventory restock, payment, or purchase order will instantly appear here in real time.
              </p>
            </div>
          ) : (
            activities.map(act => (
              <div key={act.id} className="pt-3 first:pt-0 flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getActivityIcon(act.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{act.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{act.description}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {activities.length > 0 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">{activities.length} recent events</span>
            <button
              onClick={clearActivities}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Feed</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
