import React, { useState } from 'react';
import {
  X,
  UtensilsCrossed,
  MapPin,
  ShoppingBag,
  Wifi,
  Star,
  Globe,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { RestaurantQRCode } from '../types';

interface QRCodeCreatorModalProps {
  onClose: () => void;
  onCreate: (newQR: Partial<RestaurantQRCode>) => void;
}

export const QRCodeCreatorModal: React.FC<QRCodeCreatorModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [selectedType, setSelectedType] = useState<string>('restaurant_menu');
  const [tableNumber, setTableNumber] = useState<number>(5);
  const [customTitle, setCustomTitle] = useState<string>('');

  const qrTypes = [
    {
      id: 'restaurant_menu',
      title: 'Restaurant Dynamic Menu',
      desc: 'Mobile-optimized digital menu with real-time price updates & instant ordering.',
      icon: UtensilsCrossed,
      popular: true,
      defaultTitle: 'Full Restaurant Dine-In Menu',
    },
    {
      id: 'table_standee',
      title: 'Table-Specific Standee',
      desc: 'Generates a table tent QR code that auto-fills table number for seated orders.',
      icon: MapPin,
      defaultTitle: 'Table Standee Dining',
    },
    {
      id: 'takeout_express',
      title: 'Express Pick-Up & Takeout',
      desc: 'Placed at payment counter or storefront for quick customer takeaway ordering.',
      icon: ShoppingBag,
      defaultTitle: 'Express Takeout Pick-Up',
    },
    {
      id: 'wifi_menu',
      title: 'Guest Wi-Fi + Menu Portal',
      desc: 'Prompts guests with seamless Wi-Fi connection alongside your digital menu.',
      icon: Wifi,
      defaultTitle: 'Guest Wi-Fi & Menu',
    },
    {
      id: 'feedback_review',
      title: 'Customer Feedback & Rating',
      desc: 'Collect diner reviews, tips, and direct feedback on your food and service.',
      icon: Star,
      defaultTitle: 'Customer Feedback & Rating',
    },
  ];

  const handleProceed = () => {
    const selected = qrTypes.find((t) => t.id === selectedType);
    const title =
      customTitle.trim() ||
      (selectedType === 'table_standee'
        ? `Table ${tableNumber} - Dine-In Menu`
        : selected?.defaultTitle || 'Dynamic QR Menu');

    onCreate({
      title,
      type: selectedType === 'table_standee' ? 'table' : selectedType === 'takeout_express' ? 'takeout' : 'menu',
      tableNumber: selectedType === 'table_standee' ? tableNumber : undefined,
      shortUrl: `dineqr.io/guansa-${Math.random().toString(36).substring(2, 7)}`,
      styling: {
        fgColor: '#1e3a2b',
        bgColor: '#ffffff',
        frameStyle: selectedType === 'table_standee' ? 'table-card' : 'scan-me',
        frameText:
          selectedType === 'table_standee'
            ? `TABLE ${tableNumber} · SCAN TO ORDER`
            : 'SCAN FOR DYNAMIC MENU',
        dotStyle: 'rounded',
        logoInCenter: true,
        size: 280,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Create your QR Code
            </h3>
            <p className="text-xs text-slate-500">
              Select the dynamic QR code type for your restaurant.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {qrTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{type.title}</h4>
                    {type.popular && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {type.desc}
                  </p>
                </div>
              </div>
            );
          })}

          {/* If Table Standee Selected, show table number picker */}
          {selectedType === 'table_standee' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-800">
                Assign to Table Number:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-sm text-center"
                />
                <span className="text-xs text-slate-500">
                  Orders placed will automatically be tagged to Table {tableNumber}.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
          >
            <span>Customize QR & Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
