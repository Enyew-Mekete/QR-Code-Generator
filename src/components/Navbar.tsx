import React from 'react';
import { UtensilsCrossed, Plus, QrCode } from 'lucide-react';

export type ActiveNavTab = 'qrcodes' | 'menu' | 'kitchen' | 'analytics' | 'customer';

interface NavbarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onCreateQR: () => void;
  newOrdersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onCreateQR,
  newOrdersCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single element Brand wordmark */}
          <div
            onClick={() => onSelectTab('qrcodes')}
            className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-emerald-700 transition-colors">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              Dine<span className="text-emerald-700">QR</span>
            </span>
          </div>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => onSelectTab('qrcodes')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'qrcodes'
                  ? 'text-slate-950 font-bold border-b-2 border-slate-950 py-5'
                  : 'py-5'
              }`}
            >
              QR Codes
            </button>
            <button
              onClick={() => onSelectTab('menu')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'menu'
                  ? 'text-slate-950 font-bold border-b-2 border-slate-950 py-5'
                  : 'py-5'
              }`}
            >
              Menu Manager
            </button>
            <button
              onClick={() => onSelectTab('kitchen')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'kitchen'
                  ? 'text-slate-950 font-bold border-b-2 border-slate-950 py-5'
                  : 'py-5'
              }`}
            >
              <span>Live Kitchen</span>
              {newOrdersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {newOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'text-slate-950 font-bold border-b-2 border-slate-950 py-5'
                  : 'py-5'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => onSelectTab('customer')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-emerald-800 ${
                activeTab === 'customer'
                  ? 'font-bold border-b-2 border-emerald-700 py-5'
                  : 'py-5'
              }`}
            >
              Customer Mobile View
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onCreateQR}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
