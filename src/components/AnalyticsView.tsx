import React from 'react';
import {
  TrendingUp,
  BarChart3,
  QrCode,
  DollarSign,
  Clock,
  Smartphone,
  CreditCard,
  Users,
} from 'lucide-react';
import { RestaurantQRCode, Order, RestaurantProfile } from '../types';

interface AnalyticsViewProps {
  qrCodes: RestaurantQRCode[];
  orders: Order[];
  restaurant: RestaurantProfile;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  qrCodes,
  orders,
  restaurant,
}) => {
  const totalScans = qrCodes.reduce((acc, q) => acc + q.scansCount, 0);
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((acc, o) => acc + o.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const topDishes = [
    { name: 'Guansa Special Signature Pizza', orders: 142, revenue: 2627.0 },
    { name: 'Guansa Prime Double Smash Burger', orders: 118, revenue: 1829.0 },
    { name: 'Signature Cafe Macchiato', orders: 194, revenue: 873.0 },
    { name: 'Artisan Triple-Decker Club Sandwich', orders: 86, revenue: 1199.7 },
    { name: 'Layered Mango Avocado Smoothie', orders: 74, revenue: 462.5 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          QR Scan & Dining Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics on customer QR code interactions, dining traffic, and revenue.
        </p>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total QR Scans</span>
            <QrCode className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
            {totalScans.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            ↑ 31.4% vs last 30 days
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Digital Order Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
            {restaurant.currencySymbol}
            {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Zero third-party commissions
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
            {restaurant.currencySymbol}
            {avgOrderValue.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            +18% with add-on customization
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Scan-to-Order Speed</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
            2.1 min
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Average customer order time
          </div>
        </div>
      </div>

      {/* Two Column Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Ordered Dishes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Top Performing Menu Items
          </h3>
          <div className="space-y-3">
            {topDishes.map((dish, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 font-bold text-slate-400">#{i + 1}</span>
                  <div>
                    <div className="font-bold text-slate-900">{dish.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {dish.orders} orders placed
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-900 tabular-nums">
                    {restaurant.currencySymbol}
                    {dish.revenue.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    Top Margin
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scan Activity by Venue Location / Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            QR Scans by Table & Channel
          </h3>
          <div className="space-y-3">
            {qrCodes.map((qr) => {
              const pct = Math.min(100, Math.round((qr.scansCount / totalScans) * 100)) || 20;
              return (
                <div key={qr.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>{qr.title}</span>
                    <span className="tabular-nums text-slate-600">
                      {qr.scansCount} scans ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Payment Method Distribution:</span>
            <span className="font-bold text-slate-800">
               Apple Pay 46% · GPay 28% · Card 19% · Cash 7%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
