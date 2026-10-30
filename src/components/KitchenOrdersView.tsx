import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  CreditCard,
  ChefHat,
  Bell,
  Sparkles,
  Plus,
} from 'lucide-react';
import { Order, OrderStatus, RestaurantProfile } from '../types';
import { StorageService } from '../services/storage';

interface KitchenOrdersViewProps {
  orders: Order[];
  restaurant: RestaurantProfile;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onSimulateNewOrder: () => void;
}

export const KitchenOrdersView: React.FC<KitchenOrdersViewProps> = ({
  orders,
  restaurant,
  onUpdateOrderStatus,
  onSimulateNewOrder,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play audio chime when a new order arrives
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio chime error', e);
    }
  };

  const statusColumns: {
    status: OrderStatus;
    title: string;
    icon: string;
    bgColor: string;
    textColor: string;
  }[] = [
    {
      status: 'new',
      title: 'New Orders',
      icon: '🔔',
      bgColor: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-800',
    },
    {
      status: 'preparing',
      title: 'In Preparation',
      icon: '🍳',
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
    },
    {
      status: 'ready',
      title: 'Ready for Service',
      icon: '🛎️',
      bgColor: 'bg-emerald-50 border-emerald-200',
      textColor: 'text-emerald-800',
    },
    {
      status: 'completed',
      title: 'Completed',
      icon: '✅',
      bgColor: 'bg-slate-50 border-slate-200',
      textColor: 'text-slate-700',
    },
  ];

  const getTimeElapsed = (isoString: string) => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(elapsedMs / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  return (
    <div className="space-y-6">
      {/* KDS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Live Kitchen Display System (KDS)
            </h2>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of dynamic orders placed by diners via QR code scanning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime Active' : 'Muted'}</span>
          </button>

          {/* Test Order Trigger */}
          <button
            onClick={() => {
              onSimulateNewOrder();
              playChime();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Simulate Customer Scan & Order</span>
          </button>
        </div>
      </div>

      {/* 4 Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {statusColumns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);

          return (
            <div
              key={col.status}
              className="bg-slate-100/70 rounded-2xl border border-slate-200 p-3 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{col.icon}</span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {col.title}
                  </span>
                </div>
                <span className="text-xs font-bold tabular-nums bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-700 shadow-xs">
                  {colOrders.length}
                </span>
              </div>

              {/* Order Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colOrders.length === 0 ? (
                  <div className="text-center py-12 px-3 text-slate-400 text-xs">
                    No orders {col.title.toLowerCase()}
                  </div>
                ) : (
                  colOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 space-y-3 hover:border-slate-300 transition-all animate-in fade-in zoom-in-95"
                    >
                      {/* Order Tag & Table */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {ord.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              ord.orderType === 'dine-in'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.orderType === 'dine-in'
                              ? `Table ${ord.tableNumber || 1}`
                              : 'Takeout'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {getTimeElapsed(ord.createdAt)}
                        </span>
                      </div>

                      {/* Customer Name */}
                      <div className="text-xs text-slate-600 font-medium">
                        Diner: <strong className="text-slate-800">{ord.customerName}</strong>
                      </div>

                      {/* Dishes List */}
                      <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs">
                        {ord.items.map((dish, i) => (
                          <div key={i} className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-slate-900">
                                {dish.quantity}x {dish.name}
                              </span>
                              {dish.selectedOptions &&
                                Object.keys(dish.selectedOptions).length > 0 && (
                                  <div className="text-[10px] text-slate-400">
                                    {Object.values(dish.selectedOptions).join(', ')}
                                  </div>
                                )}
                              {dish.specialInstructions && (
                                <div className="text-[10px] text-amber-600 italic">
                                  "{dish.specialInstructions}"
                                </div>
                              )}
                            </div>
                            <span className="tabular-nums font-semibold text-slate-700">
                              {restaurant.currencySymbol}
                              {(dish.price * dish.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Payment & Total */}
                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="capitalize">
                            {ord.paymentStatus === 'paid'
                              ? `Paid (${ord.paymentMethod.replace('_', ' ')})`
                              : 'Pay at Counter'}
                          </span>
                        </div>
                        <span className="font-extrabold text-slate-900 tabular-nums">
                          {restaurant.currencySymbol}
                          {ord.total.toFixed(2)}
                        </span>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="pt-1">
                        {ord.status === 'new' && (
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'preparing')}
                            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Accept & Start Cooking
                          </button>
                        )}
                        {ord.status === 'preparing' && (
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'ready')}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark Ready for Service
                          </button>
                        )}
                        {ord.status === 'ready' && (
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'completed')}
                            className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Delivered to Table
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
