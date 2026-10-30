import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  ExternalLink,
  Edit,
  Palette,
  MoreVertical,
  QrCode,
  Eye,
  Check,
  Copy,
  LayoutGrid,
  List,
  Sparkles,
  Printer,
  Trash2,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Smartphone,
} from 'lucide-react';
import { RestaurantQRCode, RestaurantProfile } from '../types';
import { QRGeneratorService } from '../services/qrGenerator';
import { UrlResolver } from '../services/urlResolver';

interface QRCodeListProps {
  qrCodes: RestaurantQRCode[];
  restaurant: RestaurantProfile;
  onCreateNew: () => void;
  onEdit: (qrCode: RestaurantQRCode) => void;
  onOpenCustomerPreview: (tableNumber?: number) => void;
  onDelete: (id: string) => void;
  onDuplicate: (qrCode: RestaurantQRCode) => void;
  onPrintTent: (qrCode: RestaurantQRCode) => void;
}

export const QRCodeList: React.FC<QRCodeListProps> = ({
  qrCodes,
  restaurant,
  onCreateNew,
  onEdit,
  onOpenCustomerPreview,
  onDelete,
  onDuplicate,
  onPrintTent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'last_created' | 'scans'>('last_created');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [qrThumbs, setQrThumbs] = useState<Record<string, string>>({});

  // Generate QR thumbnails for all items using real live scan URLs!
  useEffect(() => {
    qrCodes.forEach((qr) => {
      const scanUrl = UrlResolver.getScanUrl(qr);
      if (qr.styling.logoInCenter || qr.styling.frameStyle !== 'none') {
        QRGeneratorService.generateBrandedCanvas(scanUrl, qr.styling, {
          restaurantName: restaurant.name,
          tableLabel: qr.tableNumber ? `Table ${qr.tableNumber}` : undefined,
          logoSrc: qr.styling.customLogoUrl || (qr.styling.logoInCenter ? restaurant.logoUrl : undefined),
        }).then((dataUrl) => {
          setQrThumbs((prev) => ({ ...prev, [qr.id]: dataUrl }));
        });
      } else {
        QRGeneratorService.generateBasicDataUrl(scanUrl, qr.styling).then((dataUrl) => {
          setQrThumbs((prev) => ({ ...prev, [qr.id]: dataUrl }));
        });
      }
    });
  }, [qrCodes, restaurant]);

  const copyScanUrl = (id: string, qr: RestaurantQRCode) => {
    const scanUrl = UrlResolver.getScanUrl(qr);
    navigator.clipboard?.writeText(scanUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQR = async (qr: RestaurantQRCode) => {
    const scanUrl = UrlResolver.getScanUrl(qr);
    const brandedUrl = await QRGeneratorService.generateBrandedCanvas(
      scanUrl,
      qr.styling,
      {
        restaurantName: restaurant.name,
        tableLabel: qr.tableNumber ? `Table ${qr.tableNumber}` : undefined,
        logoSrc: qr.styling.customLogoUrl || (qr.styling.logoInCenter ? restaurant.logoUrl : undefined),
      }
    );
    QRGeneratorService.downloadImage(
      brandedUrl,
      `${restaurant.name.toLowerCase().replace(/\s+/g, '_')}_qr_${qr.id}.png`
    );
  };

  // Filter & sort list
  const filteredQRCodes = qrCodes
    .filter((qr) => {
      if (statusFilter !== 'all' && qr.status !== statusFilter) return false;
      if (typeFilter !== 'all' && qr.type !== typeFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          qr.title.toLowerCase().includes(q) ||
          qr.shortUrl.toLowerCase().includes(q) ||
          (qr.tableNumber && qr.tableNumber.toString().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'scans') return b.scansCount - a.scansCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalScans = qrCodes.reduce((acc, q) => acc + q.scansCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Scans & Capacity Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Menu Scans</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {totalScans.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            ↑ 24% from last week
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Active QR Codes</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {qrCodes.filter((q) => q.status === 'active').length}{' '}
            <span className="text-xs text-slate-400 font-normal">of 250 dynamic slots</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Unlimited menu edits
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Live Dining Tables</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {qrCodes.filter((q) => q.type === 'table').length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Direct table ordering active
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Scan-to-Order Conversion</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            68.4%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Average order time: 2.1 mins
          </div>
        </div>
      </div>

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            All QR Codes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your dynamic restaurant menus, table standees, and takeout codes.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE QR CODE</span>
        </button>
      </div>

      {/* Filter and Search Bar (matching QRCG screenshot) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Side: Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Active Only</option>
              <option value="paused">Paused</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Type Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Type: All</option>
              <option value="menu">Full Menu</option>
              <option value="table">Table Standee</option>
              <option value="takeout">Takeout / Pickup</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="last_created">Sort: Last Created</option>
              <option value="scans">Sort: Most Scanned</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Right Side: View toggle & Search input */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name or paste URL..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Pro Tips Banner (Faithfully matches user screenshot 1) */}
      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-sky-600">
              Tips: Design QR Codes That Get Results
            </div>
            <div className="text-sm font-bold text-sky-950 mt-0.5">
              Drive more table scans with clear, compelling QR code CTAs & Wi-Fi pairing.
            </div>
            <div className="text-xs text-sky-700/80 mt-0.5">
              Restaurants with framed "Scan to Order" table tents report 42% higher order volume and 3x faster turn-around times.
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const firstTable = qrCodes.find((q) => q.type === 'table') || qrCodes[0];
            if (firstTable) onPrintTent(firstTable);
          }}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs transition-colors shrink-0 whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          Print Table Standee
        </button>
      </div>

      {/* QR Codes Feed */}
      {filteredQRCodes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No QR codes found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try changing the filter options or create your first dynamic QR code.
          </p>
          <button
            onClick={onCreateNew}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Create New QR Code
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredQRCodes.map((qr) => (
            <div
              key={qr.id}
              className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Side: Thumbnail & Details */}
              <div className="flex items-center gap-4">
                {/* QR Code Thumbnail with Quick Download Button */}
                <div className="relative w-18 h-18 bg-white border border-slate-200 rounded-xl p-1.5 shrink-0 flex items-center justify-center group/thumb">
                  {qrThumbs[qr.id] ? (
                    <img
                      src={qrThumbs[qr.id]}
                      alt={qr.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-8 h-8 text-slate-400" />
                  )}
                  {/* Download overlay icon */}
                  <button
                    onClick={() => handleDownloadQR(qr)}
                    className="absolute inset-0 bg-slate-900/60 text-white rounded-xl flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-pointer"
                    title="Download high-resolution QR"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                {/* Information */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                      {qr.title}
                    </h3>
                  </div>

                  {/* Metadata Row (Clean unboxed text compliant with anti-slop) */}
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 capitalize">
                      {qr.type === 'table' ? `Table ${qr.tableNumber}` : qr.type}
                    </span>
                    <span>·</span>
                    <span>{new Date(qr.createdAt).toLocaleDateString()}</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">Dynamic (Real-time sync)</span>
                  </div>

                  {/* Live Scan Link with Test & Copy Buttons */}
                  {(() => {
                    const scanUrl = UrlResolver.getScanUrl(qr, restaurant.website);
                    return (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-lg border border-slate-200/60 max-w-md">
                          <span className="text-[11px] font-mono text-slate-700 truncate max-w-[240px] sm:max-w-xs" title={scanUrl}>
                            {scanUrl}
                          </span>
                          <button
                            onClick={() => copyScanUrl(qr.id, qr)}
                            className="p-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                            title="Copy Real Scan URL"
                          >
                            {copiedId === qr.id ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                                <Check className="w-3.5 h-3.5" /> Copied!
                              </span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <a
                          href={scanUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200/80 transition-colors"
                          title="Open live customer menu in new tab (simulates phone scan)"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Test Scan URL</span>
                        </a>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right Side: Scan Metrics & Quick Actions */}
              <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                {/* Scans Count Badge (matching screenshot) */}
                <div className="flex items-center gap-1.5 text-slate-700">
                  <QrCode className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-extrabold tabular-nums">
                    {qr.scansCount}
                  </span>
                  <span className="text-xs text-slate-400">scans</span>
                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-1">
                  {/* Test Mobile View */}
                  <button
                    onClick={() => onOpenCustomerPreview(qr.tableNumber)}
                    className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Open Customer Mobile Menu View"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>

                  {/* Print Table Tent */}
                  <button
                    onClick={() => onPrintTent(qr)}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Print Table Tent Card"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Edit Design & Menu */}
                  <button
                    onClick={() => onEdit(qr)}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Customize Design & Colors"
                  >
                    <Palette className="w-4 h-4" />
                  </button>

                  {/* More Menu Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuId(activeMenuId === qr.id ? null : qr.id)
                      }
                      className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === qr.id && (
                      <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs">
                        <button
                          onClick={() => {
                            handleDownloadQR(qr);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download High-Res PNG</span>
                        </button>
                        <button
                          onClick={() => {
                            onDuplicate(qr);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Duplicate QR Code</span>
                        </button>
                        <button
                          onClick={() => {
                            onPrintTent(qr);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Table Tent</span>
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          onClick={() => {
                            onDelete(qr.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Code</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQRCodes.map((qr) => (
            <div
              key={qr.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                {/* QR Code Big Display */}
                <div className="relative w-full aspect-square max-w-[180px] mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-center mb-4 group/box">
                  {qrThumbs[qr.id] ? (
                    <img
                      src={qrThumbs[qr.id]}
                      alt={qr.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-16 h-16 text-slate-300" />
                  )}
                  <button
                    onClick={() => handleDownloadQR(qr)}
                    className="absolute inset-0 bg-slate-900/60 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover/box:opacity-100 transition-opacity cursor-pointer font-bold text-xs gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-900 text-center">
                  {qr.title}
                </h3>
                {(() => {
                  const scanUrl = UrlResolver.getScanUrl(qr, restaurant.website);
                  return (
                    <div className="flex items-center justify-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]" title={scanUrl}>
                        {scanUrl}
                      </span>
                      <button
                        onClick={() => copyScanUrl(qr.id, qr)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy Live Scan Link"
                      >
                        {copiedId === qr.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <a
                        href={scanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-sky-600 hover:text-sky-800"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-800 tabular-nums">
                  {qr.scansCount} scans
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenCustomerPreview(qr.tableNumber)}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-slate-100"
                    title="Customer Preview"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onPrintTent(qr)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Print Tent"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(qr)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Customize"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
