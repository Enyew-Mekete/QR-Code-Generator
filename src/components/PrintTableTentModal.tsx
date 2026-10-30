import React, { useEffect, useState } from 'react';
import { X, Printer, Download, Sparkles, Wifi } from 'lucide-react';
import { RestaurantQRCode, RestaurantProfile } from '../types';
import { QRGeneratorService } from '../services/qrGenerator';
import { UrlResolver } from '../services/urlResolver';

interface PrintTableTentModalProps {
  qrCode: RestaurantQRCode;
  restaurant: RestaurantProfile;
  onClose: () => void;
}

export const PrintTableTentModal: React.FC<PrintTableTentModalProps> = ({
  qrCode,
  restaurant,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const scanUrl = UrlResolver.getScanUrl(qrCode);
    QRGeneratorService.generateBrandedCanvas(
      scanUrl,
      qrCode.styling,
      {
        restaurantName: restaurant.name,
        tableLabel: qrCode.tableNumber ? `Table ${qrCode.tableNumber}` : undefined,
        logoSrc:
          qrCode.styling.customLogoUrl ||
          (qrCode.styling.logoInCenter ? restaurant.logoUrl : undefined),
      }
    ).then((url) => {
      setQrDataUrl(url);
    });
  }, [qrCode, restaurant]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (qrDataUrl) {
      QRGeneratorService.downloadImage(
        qrDataUrl,
        `${restaurant.name.toLowerCase().replace(/\s+/g, '_')}_table_${qrCode.tableNumber || 'menu'}_qr.png`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Printable Restaurant Table Tent
            </h3>
            <p className="text-xs text-slate-500">
              Ready-to-print dual-sided table stand with dynamic QR code & Wi-Fi details.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Table Tent</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Standee Viewport */}
        <div className="p-6 bg-slate-100 overflow-y-auto max-h-[70vh] flex justify-center">
          <div
            id="printable-qr-standee"
            className="w-full max-w-md bg-white border border-slate-300 shadow-md p-6 rounded-2xl flex flex-col items-center text-center relative"
          >
            {/* Cut / Fold Marker */}
            <div className="w-full border-b border-dashed border-slate-300 pb-2 mb-4 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              ✂ Fold along dashed lines for tabletop standing
            </div>

            {/* Restaurant Branding */}
            <div className="mb-3">
              {restaurant.logoUrl && (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="w-14 h-14 object-contain mx-auto mb-1.5"
                />
              )}
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {restaurant.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {restaurant.tagline}
              </p>
            </div>

            {/* Table Badge */}
            {qrCode.tableNumber ? (
              <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3">
                TABLE {qrCode.tableNumber}
              </div>
            ) : (
              <div className="inline-block bg-emerald-700 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3">
                Dine-In & Takeout Menu
              </div>
            )}

            {/* The QR Code */}
            <div className="p-3 bg-white rounded-2xl border-2 border-slate-900/10 shadow-sm my-1">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Dynamic QR Code"
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-100 animate-pulse rounded-xl" />
              )}
            </div>

            {/* Instruction */}
            <div className="mt-3 space-y-1">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Scan with your phone camera
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No app download required. Browse dynamic menu, customize toppings, and order right from your seat.
              </p>
            </div>

            {/* Wi-Fi Info Box */}
            {restaurant.wifiSsid && (
              <div className="mt-4 pt-3 border-t border-slate-200 w-full flex items-center justify-between text-xs text-slate-600 px-4 py-2 bg-slate-50 rounded-xl">
                <span className="flex items-center gap-1.5 font-medium">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Wi-Fi: <strong className="text-slate-800">{restaurant.wifiSsid}</strong></span>
                </span>
                {restaurant.wifiPassword && (
                  <span>Pass: <code className="font-mono font-bold text-slate-900">{restaurant.wifiPassword}</code></span>
                )}
              </div>
            )}

            <div className="mt-4 text-[10px] text-slate-400">
              Powered by DineQR Dynamic Restaurant Technology
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
