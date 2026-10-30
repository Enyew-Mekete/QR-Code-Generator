import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Check,
  Palette,
  Image as ImageIcon,
  Info,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Save,
  Sparkles,
  UtensilsCrossed,
  Globe,
  CreditCard,
  QrCode,
  Eye,
  RefreshCw,
  Upload,
  FileText,
  Trash2,
  MoveUp,
  MoveDown,
  Plus,
  Sliders,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Maximize2,
  ExternalLink,
  Copy,
} from 'lucide-react';
import {
  RestaurantQRCode,
  RestaurantProfile,
  MenuCategory,
  MenuItem,
  QRFrameStyle,
  QRDotStyle,
  UploadedMenuFile,
  MenuDisplayMode,
} from '../types';
import { MobileDeviceFrame } from './MobileDeviceFrame';
import { CustomerMenuView } from './CustomerMenuView';
import { QRGeneratorService } from '../services/qrGenerator';
import { StorageService } from '../services/storage';
import { UrlResolver } from '../services/urlResolver';

interface QRCodeCustomizerProps {
  qrCode: RestaurantQRCode;
  restaurant: RestaurantProfile;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  onBack: () => void;
  onSave: (updatedQR: RestaurantQRCode, updatedRestaurant: RestaurantProfile) => void;
  onUpdateMenuItems: (items: MenuItem[]) => void;
}

export const QRCodeCustomizer: React.FC<QRCodeCustomizerProps> = ({
  qrCode,
  restaurant,
  categories,
  menuItems,
  onBack,
  onSave,
  onUpdateMenuItems,
}) => {
  // Local editable copies
  const [currentQR, setCurrentQR] = useState<RestaurantQRCode>({ ...qrCode });
  const [currentRestaurant, setCurrentRestaurant] = useState<RestaurantProfile>({ ...restaurant });
  const [items, setItems] = useState<MenuItem[]>([...menuItems]);

  // File input refs
  const menuFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const qrLogoFileInputRef = useRef<HTMLInputElement>(null);

  // Accordion active sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    design: true,
    images: true,
    menu: false,
    basic: false,
    welcome: false,
    languages: false,
    payments: false,
  });

  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'menu' | 'qr'>('menu');
  const [isDragOver, setIsDragOver] = useState(false);

  // Toggle accordion
  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Color Swatches Presets (matching exact QRCG screenshot)
  const colorPresets = [
    { name: 'Charcoal Slate', hex: '#3c4245' },
    { name: 'Navy Blue', hex: '#253b6d' },
    { name: 'Sage Olive', hex: '#8da792' },
    { name: 'Royal Plum', hex: '#582f64' },
    { name: 'Burnt Amber', hex: '#e48243' },
  ];

  // Update QR Preview image with real live scan URL
  useEffect(() => {
    const scanUrl = UrlResolver.getScanUrl(currentQR);
    QRGeneratorService.generateBrandedCanvas(
      scanUrl,
      currentQR.styling,
      {
        restaurantName: currentRestaurant.name,
        tableLabel: currentQR.tableNumber ? `Table ${currentQR.tableNumber}` : undefined,
        logoSrc: currentQR.styling.customLogoUrl || (currentQR.styling.logoInCenter ? currentRestaurant.logoUrl : undefined),
      }
    ).then((url) => setQrPreviewUrl(url));
  }, [currentQR, currentRestaurant]);

  // File Upload Handlers
  const handleMenuFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        const newFile: UploadedMenuFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: isPdf ? 'pdf' : 'image',
          url: resultUrl,
          sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: new Date().toISOString(),
          caption: file.name.replace(/\.[^/.]+$/, ''),
        };

        setCurrentRestaurant((prev) => ({
          ...prev,
          uploadedMenuFiles: [...(prev.uploadedMenuFiles || []), newFile],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRestaurantLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCurrentRestaurant((prev) => ({
        ...prev,
        logoUrl: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleQRMiddleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCurrentQR((prev) => ({
        ...prev,
        styling: {
          ...prev.styling,
          logoInCenter: true,
          customLogoUrl: dataUrl,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMenuFile = (id: string) => {
    setCurrentRestaurant((prev) => ({
      ...prev,
      uploadedMenuFiles: prev.uploadedMenuFiles.filter((f) => f.id !== id),
    }));
  };

  const handleMoveMenuFile = (index: number, direction: 'up' | 'down') => {
    const files = [...currentRestaurant.uploadedMenuFiles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const temp = files[index];
    files[index] = files[targetIndex];
    files[targetIndex] = temp;
    setCurrentRestaurant((prev) => ({
      ...prev,
      uploadedMenuFiles: files,
    }));
  };

  // Instant Availability Toggle
  const handleToggleItemAvailability = (itemId: string) => {
    const updated = items.map((i) =>
      i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i
    );
    setItems(updated);
    onUpdateMenuItems(updated);
    StorageService.toggleItemAvailability(itemId);
  };

  // Instant Price Modification
  const handleItemPriceChange = (itemId: string, newPriceStr: string) => {
    const price = parseFloat(newPriceStr);
    if (!isNaN(price) && price >= 0) {
      const updated = items.map((i) => (i.id === itemId ? { ...i, price } : i));
      setItems(updated);
      onUpdateMenuItems(updated);
      StorageService.quickUpdatePrice(itemId, price);
    }
  };

  const handleSave = () => {
    onSave(currentQR, currentRestaurant);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row matching Screenshot 5 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="Back to All Codes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              QR Code Customizer & Menu Editor
            </div>
            <input
              type="text"
              value={currentQR.title}
              onChange={(e) => setCurrentQR({ ...currentQR, title: e.target.value })}
              className="text-lg font-extrabold text-slate-900 tracking-tight bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:outline-none"
              placeholder="Name your QR Code"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Menu & QR Updated Live!</span>
            </div>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save changes</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Editor on Left, Live Mobile Phone on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Accordions (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Section 1: Design & Customization (matching screenshot 3, 4 & 5) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => toggleSection('design')}
              className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-emerald-700" />
                <span className="text-sm">Design & Customization</span>
              </div>
              {openSections.design ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.design && (
              <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-2">
                    Personalize your page by selecting some colors:
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {colorPresets.map((preset) => {
                      const isSelected = currentQR.styling.fgColor === preset.hex;
                      return (
                        <button
                          key={preset.hex}
                          onClick={() => {
                            setCurrentQR({
                              ...currentQR,
                              styling: { ...currentQR.styling, fgColor: preset.hex },
                            });
                            setCurrentRestaurant({
                              ...currentRestaurant,
                              themeColor: preset.hex,
                            });
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform cursor-pointer relative shadow-xs ${
                            isSelected ? 'scale-110 ring-2 ring-offset-2 ring-slate-900' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </button>
                      );
                    })}

                    {/* Custom Hex input (matching screenshot 3 & 5) */}
                    <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
                      <span className="text-slate-500 font-medium">Custom:</span>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <input
                          type="text"
                          value={currentQR.styling.fgColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCurrentQR({
                              ...currentQR,
                              styling: { ...currentQR.styling, fgColor: val },
                            });
                            setCurrentRestaurant({
                              ...currentRestaurant,
                              themeColor: val,
                            });
                          }}
                          className="w-20 px-2 py-1 text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none"
                        />
                        <div
                          className="w-6 h-6 m-0.5 rounded-md"
                          style={{ backgroundColor: currentQR.styling.fgColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Center Logo with Custom File Upload (User Request!) */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Optional: Embed Logo at Middle of QR Code</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Upload custom logo image (PNG, JPG, SVG) to display in center.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentQR.styling.logoInCenter}
                        onChange={(e) =>
                          setCurrentQR({
                            ...currentQR,
                            styling: { ...currentQR.styling, logoInCenter: e.target.checked },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  {currentQR.styling.logoInCenter && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-xs">
                          {currentQR.styling.customLogoUrl || currentRestaurant.logoUrl ? (
                            <img
                              src={currentQR.styling.customLogoUrl || currentRestaurant.logoUrl}
                              alt="Middle QR Logo"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <UtensilsCrossed className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">
                            {currentQR.styling.customLogoUrl ? 'Custom Middle Logo' : 'Using Restaurant Brand Logo'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            High error correction level (30%) preserves 100% scan reliability.
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          ref={qrLogoFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleQRMiddleLogoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => qrLogoFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Middle Logo</span>
                        </button>
                        {currentQR.styling.customLogoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentQR({
                                ...currentQR,
                                styling: { ...currentQR.styling, customLogoUrl: undefined },
                              })
                            }
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Frame Style Selection */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-slate-700 font-bold mb-2">
                    QR Frame & Call-to-Action Style:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'scan-me', label: 'Scan Me Pill', sample: 'SCAN TO ORDER' },
                      { id: 'table-card', label: 'Table Standee', sample: 'TABLE # · ORDER' },
                      { id: 'badge-top', label: 'Top Header', sample: 'GUANSA MENU' },
                      { id: 'none', label: 'No Frame', sample: 'Clean QR Only' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() =>
                          setCurrentQR({
                            ...currentQR,
                            styling: {
                              ...currentQR.styling,
                              frameStyle: f.id as QRFrameStyle,
                            },
                          })
                        }
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          currentQR.styling.frameStyle === f.id
                            ? 'border-slate-900 bg-slate-50 font-bold text-slate-900 ring-1 ring-slate-900'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs">{f.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{f.sample}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Images & Uploaded Menu Sheets / PDF (Faithfully matching user screenshot 5!) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => toggleSection('images')}
              className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span className="text-sm">Images & Scanned Menu (PDF / Image Upload)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  {currentRestaurant.uploadedMenuFiles?.length || 0} files uploaded
                </span>
                {openSections.images ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.images && (
              <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 text-xs">
                <p className="text-slate-500">
                  Upload or drag and drop images or PDF sheets to include in your restaurant menu. Customers will see these high-resolution sheets immediately when they scan.
                </p>

                {/* Display Mode Switcher (Hybrid, PDF/Image only, or Interactive only) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-slate-700 font-bold text-xs">
                    Customer Menu Presentation Mode:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'hybrid', label: 'Hybrid (Both)', desc: 'Document + Digital Order' },
                      { id: 'document', label: 'PDF / Image Only', desc: 'Full-Screen Menu Sheet' },
                      { id: 'interactive', label: 'Digital Order Only', desc: 'Item Cards & Categories' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() =>
                          setCurrentRestaurant({
                            ...currentRestaurant,
                            menuDisplayMode: mode.id as MenuDisplayMode,
                          })
                        }
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          currentRestaurant.menuDisplayMode === mode.id
                            ? 'bg-slate-900 text-white font-bold border-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs">{mode.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            currentRestaurant.menuDisplayMode === mode.id
                              ? 'text-slate-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {mode.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drag and Drop Zone (matching user screenshot 5) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleMenuFileUpload(e.dataTransfer.files);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDragOver
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-300 bg-slate-50/50 hover:border-slate-400'
                  }`}
                >
                  <input
                    ref={menuFileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleMenuFileUpload(e.target.files)}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      Drag and drop images or PDF here
                    </div>
                    <div className="text-slate-400 text-xs">
                      Supports JPG, PNG, WEBP and PDF menu boards
                    </div>
                    <button
                      type="button"
                      onClick={() => menuFileInputRef.current?.click()}
                      className="mt-2 px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>

                {/* Grid View Checkbox (matching screenshot 5) */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="grid-view-check"
                    checked={currentRestaurant.showImagesInGrid || false}
                    onChange={(e) =>
                      setCurrentRestaurant({
                        ...currentRestaurant,
                        showImagesInGrid: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label
                    htmlFor="grid-view-check"
                    className="text-slate-700 font-medium cursor-pointer"
                  >
                    Show images in grid view on customer phones
                  </label>
                </div>

                {/* Uploaded Menu Files List */}
                {currentRestaurant.uploadedMenuFiles &&
                  currentRestaurant.uploadedMenuFiles.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-700">
                        Active Menu Sheets & Documents ({currentRestaurant.uploadedMenuFiles.length}):
                      </div>
                      <div className="space-y-2">
                        {currentRestaurant.uploadedMenuFiles.map((file, idx) => (
                          <div
                            key={file.id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 group hover:border-slate-300 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-14 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                                {file.type === 'pdf' ? (
                                  <div className="flex flex-col items-center justify-center text-rose-500">
                                    <FileText className="w-6 h-6" />
                                    <span className="text-[9px] font-bold mt-0.5">PDF</span>
                                  </div>
                                ) : (
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">
                                  {file.caption || file.name}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="uppercase font-semibold text-slate-600">
                                    {file.type}
                                  </span>
                                  <span>·</span>
                                  <span>{file.sizeFormatted || '1.2 MB'}</span>
                                  <span>·</span>
                                  <span className="text-emerald-700 font-semibold">Active in scan</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveMenuFile(idx, 'up')}
                                className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                title="Move Up"
                              >
                                <MoveUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={
                                  idx === currentRestaurant.uploadedMenuFiles.length - 1
                                }
                                onClick={() => handleMoveMenuFile(idx, 'down')}
                                className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                title="Move Down"
                              >
                                <MoveDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMenuFile(file.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Remove File"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Section 3: Basic Information (matching screenshot 3, 4 & 5) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => toggleSection('basic')}
              className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-emerald-700" />
                <span className="text-sm">Basic Information</span>
              </div>
              {openSections.basic ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.basic && (
              <div className="px-5 pb-5 pt-1 space-y-3.5 border-t border-slate-100 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Title:
                  </label>
                  <input
                    type="text"
                    value={currentRestaurant.name}
                    onChange={(e) =>
                      setCurrentRestaurant({ ...currentRestaurant, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    placeholder="Title for your menu"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Description:
                  </label>
                  <textarea
                    rows={2}
                    value={currentRestaurant.tagline}
                    onChange={(e) =>
                      setCurrentRestaurant({ ...currentRestaurant, tagline: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    placeholder="More information about your restaurant..."
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Website:
                  </label>
                  <input
                    type="url"
                    value={currentRestaurant.website}
                    onChange={(e) =>
                      setCurrentRestaurant({ ...currentRestaurant, website: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                    placeholder="https://www.your-restaurant.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Guest Wi-Fi (SSID):
                    </label>
                    <input
                      type="text"
                      value={currentRestaurant.wifiSsid}
                      onChange={(e) =>
                        setCurrentRestaurant({
                          ...currentRestaurant,
                          wifiSsid: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Wi-Fi Password:
                    </label>
                    <input
                      type="text"
                      value={currentRestaurant.wifiPassword || ''}
                      onChange={(e) =>
                        setCurrentRestaurant({
                          ...currentRestaurant,
                          wifiPassword: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Welcome Screen & Brand Logo Upload (matching screenshot 4 & 5) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => toggleSection('welcome')}
              className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span className="text-sm">Welcome Screen & Brand Logo Upload</span>
              </div>
              {openSections.welcome ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.welcome && (
              <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 text-xs">
                <p className="text-slate-500">
                  Display your logo while your page is loading on mobile phones.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Image Slot Box (matching screenshot 5) */}
                  <div className="w-40 h-28 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-center p-3 overflow-hidden shadow-xs relative group">
                    {currentRestaurant.logoUrl ? (
                      <img
                        src={currentRestaurant.logoUrl}
                        alt="Restaurant Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                        <span className="text-[10px]">No logo</span>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="space-y-2">
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleRestaurantLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('menu')}
                      className="block text-sky-600 hover:text-sky-800 font-semibold text-xs cursor-pointer"
                    >
                      Preview on phone
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Real-time Menu Pricing & Item Availability */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => toggleSection('menu')}
              className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
                <span className="text-sm">Real-Time Menu Pricing & Item Availability</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Live Instant Sync
                </span>
                {openSections.menu ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.menu && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-100 text-xs">
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{categories.find((c) => c.id === item.categoryId)?.name}</span>
                            <span>·</span>
                            <span>{item.isAvailable ? 'In Stock' : 'Sold Out'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                          <span className="text-slate-400 font-bold">
                            {currentRestaurant.currencySymbol}
                          </span>
                          <input
                            type="number"
                            step="0.25"
                            value={item.price}
                            onChange={(e) => handleItemPriceChange(item.id, e.target.value)}
                            className="w-14 text-xs font-bold font-mono text-slate-900 focus:outline-none"
                          />
                        </div>

                        <button
                          onClick={() => handleToggleItemAvailability(item.id)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                            item.isAvailable
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {item.isAvailable ? 'In Stock' : 'Sold Out'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: LIVE Interactive Phone Simulator with [Preview] / [QR Code] Tabs (matching screenshot 5!) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4">
            {/* Phone Header & Mode Switcher matching screenshot 5 */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>Customer Mobile View</span>
              </div>

              {/* Segmented Toggle: [Preview] | [QR Code] */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setActivePreviewTab('menu')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    activePreviewTab === 'menu'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActivePreviewTab('qr')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    activePreviewTab === 'qr'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  QR Code
                </button>
              </div>
            </div>

            {/* The Phone Container */}
            {activePreviewTab === 'menu' ? (
              <MobileDeviceFrame
                width="100%"
                height={680}
                restaurantName={currentRestaurant.name}
              >
                <CustomerMenuView
                  restaurant={currentRestaurant}
                  categories={categories}
                  menuItems={items}
                  initialTableNumber={currentQR.tableNumber || 4}
                />
              </MobileDeviceFrame>
            ) : (
              <div className="h-[680px] bg-slate-50 rounded-[38px] border border-slate-200 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-200 max-w-xs mx-auto">
                  {qrPreviewUrl ? (
                    <img
                      src={qrPreviewUrl}
                      alt="QR Code"
                      className="w-64 h-64 object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-slate-100 animate-pulse rounded-2xl" />
                  )}
                </div>
                <div className="mt-3 text-xs font-bold text-slate-800">
                  {currentQR.title}
                </div>
                {(() => {
                  const scanUrl = UrlResolver.getScanUrl(currentQR);
                  return (
                    <div className="mt-2 space-y-2 w-full max-w-xs">
                      {/* Live link container */}
                      <div className="flex items-center justify-between gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                        <span className="text-[11px] text-slate-600 font-mono truncate" title={scanUrl}>
                          {scanUrl}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(scanUrl);
                            alert('Copied live scan URL to clipboard!');
                          }}
                          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                          title="Copy Scan URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Phone scan tip badge */}
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-left text-[11px] text-emerald-900 flex items-start gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-emerald-950">Real Smartphone Test</div>
                          <div className="text-[10px] text-emerald-800 leading-tight mt-0.5">
                            Point your mobile phone camera at this QR code right now to test opening your menu on your phone!
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={scanUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Test in Tab</span>
                        </a>
                        <button
                          onClick={() => {
                            if (qrPreviewUrl) {
                              QRGeneratorService.downloadImage(
                                qrPreviewUrl,
                                `${currentRestaurant.name.toLowerCase().replace(/\s+/g, '_')}_qr.png`
                              );
                            }
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          <span>Download QR</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
