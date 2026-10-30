import React from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  restaurantName?: string;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({
  children,
  width = 375,
  height = 760,
  restaurantName = 'Guansa Coffee Hub',
}) => {
  return (
    <div
      className="relative mx-auto rounded-[48px] p-3.5 bg-slate-900 shadow-2xl ring-1 ring-slate-800/80 shadow-slate-900/40 select-none transition-all"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      {/* Outer Phone Bezel Buttons */}
      <div className="absolute -left-[5px] top-28 w-[4px] h-10 bg-slate-700 rounded-l-md" />
      <div className="absolute -left-[5px] top-42 w-[4px] h-12 bg-slate-700 rounded-l-md" />
      <div className="absolute -left-[5px] top-58 w-[4px] h-12 bg-slate-700 rounded-l-md" />
      <div className="absolute -right-[5px] top-36 w-[4px] h-16 bg-slate-700 rounded-r-md" />

      {/* Screen Container */}
      <div className="relative w-full h-full bg-slate-50 dark:bg-slate-950 rounded-[38px] overflow-hidden flex flex-col border border-slate-800/20">
        {/* iOS Dynamic Island & Status Bar */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 pt-3 pb-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-100">
          <span className="tabular-nums">9:41</span>

          {/* Dynamic Island Pill */}
          <div className="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
          </div>

          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Scrollable Mobile Viewport */}
        <div className="relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth overscroll-contain">
          {children}
        </div>

        {/* iOS Bottom Home Indicator Bar */}
        <div className="sticky bottom-0 z-50 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex justify-center pointer-events-none">
          <div className="w-32 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};
