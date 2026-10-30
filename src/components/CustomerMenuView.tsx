import React, { useState, useMemo } from 'react';
import {
  Search,
  Globe,
  Wifi,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  X,
  CreditCard,
  Clock,
  Sparkles,
  ChevronRight,
  Flame,
  Leaf,
  ShieldCheck,
  Smartphone,
  Copy,
  ArrowLeft,
  UtensilsCrossed,
  FileText,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  Download,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  RestaurantProfile,
  MenuCategory,
  MenuItem,
  Order,
  PaymentMethod,
  LanguageCode,
} from '../types';
import { SUPPORTED_LANGUAGES } from '../data/translations';
import { TranslatorService } from '../services/translator';
import { StorageService } from '../services/storage';

interface CustomerMenuViewProps {
  restaurant: RestaurantProfile;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  initialTableNumber?: number;
  onOrderCreated?: (order: Order) => void;
  isStandalone?: boolean;
}

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({
  restaurant,
  categories,
  menuItems,
  initialTableNumber = 4,
  onOrderCreated,
  isStandalone = false,
}) => {
  // Localization
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');

  // Table assignment
  const [tableNumber, setTableNumber] = useState<number>(initialTableNumber);
  const [isEditingTable, setIsEditingTable] = useState(false);

  // Cart state
  interface CartEntry {
    item: MenuItem;
    quantity: number;
    selectedOptions: Record<string, { choiceId: string; label: string; priceDelta: number }>;
    specialInstructions?: string;
  }
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Item customization modal
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, { choiceId: string; label: string; priceDelta: number }>
  >({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Checkout & Payment State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout'>('dine-in');
  const [customerName, setCustomerName] = useState('Alex Morgan');
  const [customerPhone, setCustomerPhone] = useState('+1 (555) 345-9872');
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [customTip, setCustomTip] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('apple_pay');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 9012');
  const [cardExp, setCardExp] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('382');
  const [cardHolder, setCardHolder] = useState('Alex Morgan');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Document / Uploaded Menu Sheet Viewer State
  const hasUploadedDocs = Boolean(restaurant.uploadedMenuFiles && restaurant.uploadedMenuFiles.length > 0);
  const [customerViewMode, setCustomerViewMode] = useState<'document' | 'interactive'>(
    hasUploadedDocs ? 'document' : 'interactive'
  );
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [docZoom, setDocZoom] = useState(1);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);

  const cleanWebsiteUrl = useMemo(() => {
    return (restaurant.website || 'guansa-maed-mu.vercel.app')
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '');
  }, [restaurant.website]);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: restaurant.name,
          text: `${restaurant.name} - ${restaurant.tagline || 'Menu'}`,
          url: window.location.href,
        });
        return;
      } catch {
        // User dismissed or share declined, fallback to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }
  };

  // When restaurant has uploaded menu sheets, ensure customer view displays the uploaded menu sheet!
  React.useEffect(() => {
    if (hasUploadedDocs) {
      setCustomerViewMode('document');
    }
  }, [hasUploadedDocs, restaurant.uploadedMenuFiles]);

  const t = (key: string) => TranslatorService.getUIText(key, currentLang);
  const isRtl = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.dir === 'rtl';

  // Open item customization drawer
  const handleItemClick = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCustomizingItem(item);
    setItemQuantity(1);
    setSpecialInstructions('');

    // Preselect first choices for required options
    const defaults: Record<string, { choiceId: string; label: string; priceDelta: number }> = {};
    if (item.options) {
      item.options.forEach((opt) => {
        if (opt.required && opt.choices.length > 0) {
          defaults[opt.id] = {
            choiceId: opt.choices[0].id,
            label: opt.choices[0].label,
            priceDelta: opt.choices[0].priceDelta,
          };
        }
      });
    }
    setSelectedOptions(defaults);
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!customizingItem) return;
    setCart((prev) => [
      ...prev,
      {
        item: customizingItem,
        quantity: itemQuantity,
        selectedOptions,
        specialInstructions: specialInstructions.trim() || undefined,
      },
    ]);
    setCustomizingItem(null);
  };

  // Quick add without opening drawer if no required options
  const handleQuickAdd = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    const hasRequired = item.options?.some((o) => o.required);
    if (hasRequired) {
      handleItemClick(item);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((entry) => entry.item.id === item.id && !entry.specialInstructions);
      if (existing) {
        return prev.map((entry) =>
          entry === existing ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...prev, { item, quantity: 1, selectedOptions: {} }];
    });
  };

  // Calculate pricing
  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, entry) => {
      const optionsDelta = Object.values(entry.selectedOptions).reduce(
        (acc, curr) => acc + curr.priceDelta,
        0
      );
      return total + (entry.item.price + optionsDelta) * entry.quantity;
    }, 0);
  }, [cart]);

  const taxAmount = (cartSubtotal * restaurant.taxRatePercent) / 100;

  const tipAmount = useMemo(() => {
    if (customTip !== '') {
      const num = parseFloat(customTip);
      return isNaN(num) ? 0 : num;
    }
    return (cartSubtotal * tipPercentage) / 100;
  }, [cartSubtotal, tipPercentage, customTip]);

  const totalAmount = cartSubtotal + taxAmount + tipAmount;
  const totalItemCount = cart.reduce((acc, c) => acc + c.quantity, 0);

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category match
      if (activeCategory !== 'all' && item.categoryId !== activeCategory) {
        return false;
      }
      // Dietary filter
      if (selectedDietary === 'vegetarian' && !item.isVegetarian) return false;
      if (selectedDietary === 'vegan' && !item.isVegan) return false;
      if (selectedDietary === 'gluten-free' && !item.isGlutenFree) return false;
      if (selectedDietary === 'halal' && !item.isHalal) return false;
      if (selectedDietary === 'popular' && !item.isPopular) return false;

      // Search match
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const translated = TranslatorService.translateItem(
          item.name,
          item.description,
          currentLang,
          item.translations
        );
        const matchName =
          item.name.toLowerCase().includes(query) || translated.name.toLowerCase().includes(query);
        const matchDesc =
          item.description.toLowerCase().includes(query) ||
          translated.description.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [menuItems, activeCategory, selectedDietary, searchQuery, currentLang]);

  // Handle final secure payment
  const handleProcessPayment = () => {
    if (cart.length === 0) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      const newOrder: Order = {
        id: `ord_${Date.now().toString().slice(-4)}`,
        orderNumber: `#${Math.floor(100 + Math.random() * 900)}`,
        restaurantId: restaurant.id,
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        orderType,
        customerName: customerName.trim() || 'Guest Diner',
        customerPhone: customerPhone.trim() || undefined,
        items: cart.map((c) => ({
          menuItemId: c.item.id,
          name: c.item.name,
          price: c.item.price,
          quantity: c.quantity,
          selectedOptions: Object.fromEntries(
            Object.entries(c.selectedOptions).map(([k, v]) => [k, v.label])
          ),
          specialInstructions: c.specialInstructions,
        })),
        subtotal: Number(cartSubtotal.toFixed(2)),
        tax: Number(taxAmount.toFixed(2)),
        tip: Number(tipAmount.toFixed(2)),
        total: Number(totalAmount.toFixed(2)),
        paymentMethod,
        paymentStatus: paymentMethod === 'counter_cash' ? 'pending' : 'paid',
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedMinutes: 12 + cart.length * 2,
      };

      StorageService.createOrder(newOrder);
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }

      setIsProcessingPayment(false);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setCompletedOrder(newOrder);
      setCart([]);

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
        });
      } catch (e) {
        console.warn('Confetti error', e);
      }
    }, 1200);
  };

  const copyWifiPassword = () => {
    if (restaurant.wifiPassword) {
      navigator.clipboard?.writeText(restaurant.wifiPassword);
      setWifiCopied(true);
      setTimeout(() => setWifiCopied(false), 2000);
    }
  };

  return (
    <div
      className={`min-h-full bg-slate-50 text-slate-900 pb-28 ${
        isRtl ? 'text-right' : 'text-left'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* SCANNED DOCUMENT LOOKBOOK VIEW (Matches exact QRCG layout from mobile screenshot) */}
      {customerViewMode === 'document' && hasUploadedDocs ? (
        <div className="relative min-h-screen bg-[#ebedf0] pb-24 font-sans select-none overflow-x-hidden">
          {/* Signature Dark Diagonal Backdrop */}
          <div
            className="absolute top-0 left-0 right-0 h-[380px] sm:h-[420px] pointer-events-none transition-colors duration-300"
            style={{
              backgroundColor: restaurant.themeColor || '#3c4245',
              clipPath: 'polygon(0 0, 100% 0, 100% 74%, 0 100%)',
            }}
          />

          {/* Top Share Action Bar */}
          <div className="relative z-20 flex justify-end p-4">
            <button
              onClick={handleShare}
              className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Share Menu"
              aria-label="Share Menu"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Restaurant Title & Subtitle */}
          <div className="relative z-10 px-4 text-center -mt-2 pb-5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {restaurant.name}
            </h1>
            <p className="text-sm font-normal text-slate-300/90 mt-1">
              {restaurant.tagline || 'Guansa Coffee Menu'}
            </p>
          </div>

          {/* Centered Floating Menu Sheet Card */}
          <div className="relative z-20 px-4 sm:px-6 max-w-sm sm:max-w-md mx-auto">
            <div
              onClick={() =>
                setLightboxImageUrl(
                  restaurant.uploadedMenuFiles[activeDocIndex]?.url || './assets/guansa_menu_sheet.png'
                )
              }
              className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/25 overflow-hidden border border-black/5 cursor-pointer group transition-transform duration-200 active:scale-[0.99]"
            >
              <img
                src={
                  restaurant.uploadedMenuFiles[activeDocIndex]?.url || './assets/guansa_menu_sheet.png'
                }
                alt={restaurant.uploadedMenuFiles[activeDocIndex]?.name || 'Guansa Coffee Hub Menu'}
                className="w-full h-auto object-contain block bg-white"
                loading="eager"
              />

              {/* Tap to Zoom indicator */}
              <div className="absolute bottom-3 right-3 bg-slate-900/75 hover:bg-slate-900 text-white backdrop-blur-md px-2.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-md opacity-85 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tap to Zoom</span>
              </div>
            </div>

            {/* Pagination Controls if Multiple Menu Sheets */}
            {restaurant.uploadedMenuFiles.length > 1 && (
              <div className="flex items-center justify-center gap-3 mt-3 text-xs font-semibold text-slate-600">
                <button
                  disabled={activeDocIndex === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDocIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="p-1.5 rounded-full bg-white shadow-xs border border-slate-200 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-slate-700">
                  {activeDocIndex + 1} / {restaurant.uploadedMenuFiles.length}
                </span>
                <button
                  disabled={activeDocIndex === restaurant.uploadedMenuFiles.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDocIndex((prev) =>
                      Math.min(restaurant.uploadedMenuFiles.length - 1, prev + 1)
                    );
                  }}
                  className="p-1.5 rounded-full bg-white shadow-xs border border-slate-200 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bottom Website Link Matching Exact User Screenshot */}
            <div className="text-center py-4">
              <a
                href={restaurant.website || 'https://guansa-maed-mu.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 text-sm font-medium tracking-wide transition-colors inline-block"
              >
                {cleanWebsiteUrl}
              </a>
            </div>
          </div>

          {/* Floating Actions Pill: Table, Digital Order & Wi-Fi */}
          <div className="fixed bottom-5 left-0 right-0 flex justify-center px-4 z-40 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white p-1.5 pl-3.5 pr-2 rounded-full shadow-2xl border border-white/20">
              <div className="text-xs font-semibold flex items-center gap-1.5 mr-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Table {tableNumber}</span>
              </div>
              <button
                onClick={() => setCustomerViewMode('interactive')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3.5 rounded-full flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Order Online</span>
              </button>
              {restaurant.wifiSsid && (
                <button
                  onClick={() => setShowWifiModal(true)}
                  className="p-2 rounded-full text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  title="Guest Wi-Fi"
                >
                  <Wifi className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Toast Notification when Share URL Copied */}
          {showShareToast && (
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Menu link copied to clipboard!</span>
            </div>
          )}
        </div>
      ) : (
        /* INTERACTIVE DIGITAL ORDERING HEADER */
        <div className="relative bg-slate-900 text-white">
          {restaurant.coverImageUrl && (
            <div className="absolute inset-0 opacity-40 mix-blend-overlay overflow-hidden">
              <img
                src={restaurant.coverImageUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="relative px-4 pt-4 pb-5 flex flex-col gap-3">
            {/* Top Bar with Return to Lookbook, Language Selector and Wi-Fi */}
            <div className="flex items-center justify-between">
              {hasUploadedDocs ? (
                <button
                  onClick={() => setCustomerViewMode('document')}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>View Paper Menu</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-white">
                  <span>📍 {t('tableNumber')} {tableNumber}</span>
                </div>
              )}

              {/* Quick Actions (Language & Wi-Fi) */}
              <div className="flex items-center gap-2">
                {restaurant.wifiSsid && (
                  <button
                    onClick={() => setShowWifiModal(true)}
                    className="flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-white transition-colors cursor-pointer"
                    title="Guest Wi-Fi"
                  >
                    <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="hidden sm:inline">Wi-Fi</span>
                  </button>
                )}

                {/* Language Switcher */}
                <div className="relative">
                  <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>
                      {SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.flag}{' '}
                      {currentLang.toUpperCase()}
                    </span>
                  </button>

                  {showLangMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Select Language
                      </div>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setCurrentLang(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer ${
                            currentLang === lang.code ? 'text-emerald-700 bg-emerald-50/60 font-bold' : ''
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-base">{lang.flag}</span>
                            <span>{lang.nativeLabel}</span>
                          </span>
                          {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Restaurant Identity */}
            <div className="flex items-center gap-3.5 mt-1">
              <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md shrink-0 flex items-center justify-center overflow-hidden border border-white/20">
                {restaurant.logoUrl ? (
                  <img
                    src={restaurant.logoUrl}
                    alt={restaurant.name}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <UtensilsCrossed className="w-7 h-7 text-emerald-800" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                  {restaurant.name}
                </h1>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{restaurant.tagline}</p>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium mt-1">
                  <span>⏱️ 10–15 min prep</span>
                  <span>·</span>
                  <span className="text-slate-300">📍 Table {tableNumber}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE DIGITAL ORDERING VIEW */}
      {(customerViewMode === 'interactive' || !hasUploadedDocs) && (
        <>
          {/* Sticky Search & Dietary Filter Section */}
          <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-xs">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Horizontal Scroller */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar scroll-smooth">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('allCategories')}
              </button>
              {categories.map((cat) => {
                const catName =
                  cat.translations && cat.translations[currentLang]
                    ? cat.translations[currentLang]
                    : cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {catName}
                  </button>
                );
              })}
            </div>

            {/* Dietary Filter Segmented Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] text-slate-500 font-medium no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'popular', label: '🔥 Popular' },
                { id: 'vegetarian', label: '🌱 Veg' },
                { id: 'vegan', label: '🌿 Vegan' },
                { id: 'gluten-free', label: '🌾 Gluten-Free' },
                { id: 'halal', label: '✨ Halal' },
              ].map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedDietary(tag.id)}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    selectedDietary === tag.id
                      ? 'bg-emerald-100 text-emerald-800 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Menu Item Cards List */}
      <div className="px-4 py-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No dishes found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or dietary filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                setSelectedDietary('all');
              }}
              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const translated = TranslatorService.translateItem(
              item.name,
              item.description,
              currentLang,
              item.translations
            );

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group relative bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex gap-3.5 cursor-pointer ${
                  !item.isAvailable ? 'opacity-65' : ''
                }`}
              >
                {/* Food Image Slot */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={translated.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                      <UtensilsCrossed className="w-6 h-6" />
                    </div>
                  )}

                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-1">
                      <span className="text-[10px] font-bold tracking-wider text-rose-300 uppercase text-center">
                        {t('soldOut')}
                      </span>
                    </div>
                  )}

                  {item.isPopular && item.isAvailable && (
                    <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                      Popular
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {translated.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {translated.description}
                    </p>

                    {/* Quiet dietary indicator text */}
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-medium">
                      {item.isVegetarian && <span>🌱 Veg</span>}
                      {item.isVegan && <span>🌿 Vegan</span>}
                      {item.isGlutenFree && <span>🌾 Gluten-Free</span>}
                      {item.prepTimeMinutes && (
                        <span>⏱️ {item.prepTimeMinutes}m</span>
                      )}
                      {item.calories && (
                        <span className="tabular-nums">{item.calories} kcal</span>
                      )}
                    </div>
                  </div>

                  {/* Price & Add Button */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                        {restaurant.currencySymbol}
                        {item.price.toFixed(2)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-[11px] text-slate-400 line-through tabular-nums">
                          {restaurant.currencySymbol}
                          {item.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {item.isAvailable ? (
                      <button
                        onClick={(e) => handleQuickAdd(e, item)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('addToCart')}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-rose-500">
                        {t('soldOut')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar (Compliant with 15% Mobile Sticky Cap) */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 left-4 right-4 z-40 max-w-md mx-auto">
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between ring-1 ring-white/10 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-slate-900 text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                  {totalItemCount}
                </span>
              </div>
              <div>
                <div className="text-[11px] text-slate-300 font-medium">
                  {totalItemCount} {t('items')} · {t('tableNumber')} {tableNumber}
                </div>
                <div className="text-base font-extrabold tabular-nums">
                  {restaurant.currencySymbol}
                  {cartSubtotal.toFixed(2)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm active:scale-95 cursor-pointer"
            >
              <span>{t('viewCart')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Customization Bottom Sheet / Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom-5">
            {/* Modal Drag Handle & Close */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <h3 className="text-sm font-bold text-slate-900 truncate mt-1">
                Customize Dish
              </h3>
              <button
                onClick={() => setCustomizingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Item Photo & Title */}
              <div className="flex gap-3">
                <img
                  src={customizingItem.imageUrl}
                  alt={customizingItem.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {TranslatorService.translateItem(
                      customizingItem.name,
                      customizingItem.description,
                      currentLang,
                      customizingItem.translations
                    ).name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {TranslatorService.translateItem(
                      customizingItem.name,
                      customizingItem.description,
                      currentLang,
                      customizingItem.translations
                    ).description}
                  </p>
                  <div className="text-sm font-extrabold text-emerald-800 mt-1 tabular-nums">
                    {restaurant.currencySymbol}
                    {customizingItem.price.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Customization Options */}
              {customizingItem.options?.map((opt) => (
                <div key={opt.id} className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      {opt.name}
                    </span>
                    {opt.required ? (
                      <span className="text-[10px] font-semibold text-rose-500 uppercase">
                        Required
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Optional</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {opt.choices.map((choice) => {
                      const isSelected = selectedOptions[opt.id]?.choiceId === choice.id;
                      return (
                        <button
                          key={choice.id}
                          onClick={() => {
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [opt.id]: {
                                choiceId: choice.id,
                                label: choice.label,
                                priceDelta: choice.priceDelta,
                              },
                            }));
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-semibold'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span>{choice.label}</span>
                          <span className="tabular-nums font-medium text-slate-500">
                            {choice.priceDelta > 0
                              ? `+${restaurant.currencySymbol}${choice.priceDelta.toFixed(2)}`
                              : 'Included'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Special Instructions */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t('specialInstructions')}
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. extra crispy, dressing on the side, no onions..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              {/* Quantity Selector & Action Button */}
              <div className="pt-2 flex items-center gap-3">
                <div className="flex items-center bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-700 font-bold shadow-xs active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-xs tabular-nums text-slate-900">
                    {itemQuantity}
                  </span>
                  <button
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-700 font-bold shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {t('addToCart')} · {restaurant.currencySymbol}
                    {(
                      (customizingItem.price +
                        Object.values(selectedOptions).reduce(
                          (acc, curr) => acc + curr.priceDelta,
                          0
                        )) *
                      itemQuantity
                    ).toFixed(2)}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Drawer with Real-Time Payment Gateway Simulation */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom-5">
            {/* Checkout Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>{t('orderSummary')}</span>
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Dining Mode (Dine-in vs Takeout) */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setOrderType('dine-in')}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    orderType === 'dine-in'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🍽️ {t('dineIn')} (Table {tableNumber})
                </button>
                <button
                  onClick={() => setOrderType('takeout')}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    orderType === 'takeout'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🥡 {t('takeout')}
                </button>
              </div>

              {/* Order Items Review */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Items in Basket
                </div>
                {cart.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-slate-900">
                        {entry.quantity}x {entry.item.name}
                      </div>
                      {Object.keys(entry.selectedOptions).length > 0 && (
                        <div className="text-[11px] text-slate-400">
                          {Object.values(entry.selectedOptions)
                            .map((o) => o.label)
                            .join(', ')}
                        </div>
                      )}
                      {entry.specialInstructions && (
                        <div className="text-[11px] text-amber-600 italic">
                          Note: "{entry.specialInstructions}"
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-slate-800 tabular-nums">
                      {restaurant.currencySymbol}
                      {(
                        (entry.item.price +
                          Object.values(entry.selectedOptions).reduce(
                            (a, b) => a + b.priceDelta,
                            0
                          )) *
                        entry.quantity
                      ).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Contact Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                    placeholder="Guest Diner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Phone / SMS updates
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Staff Tip Selection */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">{t('tip')}</span>
                  <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                    {restaurant.currencySymbol}
                    {tipAmount.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-xs">
                  {[0, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => {
                        setTipPercentage(pct);
                        setCustomTip('');
                      }}
                      className={`py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                        tipPercentage === pct && customTip === ''
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom"
                    value={customTip}
                    onChange={(e) => {
                      setCustomTip(e.target.value);
                      setTipPercentage(-1);
                    }}
                    className="px-1.5 py-1.5 rounded-lg border border-slate-200 text-center text-xs font-medium focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Cost Totals breakdown */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{t('subtotal')}</span>
                  <span className="tabular-nums">
                    {restaurant.currencySymbol}
                    {cartSubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    {t('tax')} ({restaurant.taxRatePercent}%)
                  </span>
                  <span className="tabular-nums">
                    {restaurant.currencySymbol}
                    {taxAmount.toFixed(2)}
                  </span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Staff Tip</span>
                    <span className="tabular-nums">
                      {restaurant.currencySymbol}
                      {tipAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>{t('total')}</span>
                  <span className="text-emerald-700 tabular-nums">
                    {restaurant.currencySymbol}
                    {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Gateway Method Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  {t('selectPayment')}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Apple Pay */}
                  <button
                    onClick={() => setPaymentMethod('apple_pay')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === 'apple_pay'
                        ? 'border-black bg-black text-white font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm"></span>
                    <span>Apple Pay</span>
                  </button>

                  {/* Google Pay */}
                  <button
                    onClick={() => setPaymentMethod('google_pay')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === 'google_pay'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-extrabold text-blue-600">G</span>
                    <span>Google Pay</span>
                  </button>

                  {/* Credit Card */}
                  <button
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === 'credit_card'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Credit Card</span>
                  </button>

                  {/* Pay at Counter */}
                  <button
                    onClick={() => setPaymentMethod('counter_cash')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === 'counter_cash'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>💵</span>
                    <span>Pay at Counter</span>
                  </button>
                </div>

                {/* Inline Card Inputs if Credit Card selected */}
                {paymentMethod === 'credit_card' && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 font-mono text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Expiry
                        </label>
                        <input
                          type="text"
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          CVC
                        </label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pay Now Button */}
              <button
                disabled={isProcessingPayment}
                onClick={handleProcessPayment}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 active:scale-98 transition-all cursor-pointer"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {t('payNow')} · {restaurant.currencySymbol}
                      {totalAmount.toFixed(2)}
                    </span>
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-bit encrypted dynamic ordering & payment gateway</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmed Screen / Receipt Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Order {completedOrder.orderNumber} Confirmed
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {t('orderPlaced')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('orderPlacedSubtitle')}
              </p>
            </div>

            {/* Live Progress Tracker */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Est. Prep Time</span>
                </span>
                <span className="text-emerald-700 tabular-nums">
                  ~{completedOrder.estimatedMinutes} mins
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-2/5 rounded-full animate-pulse" />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-medium">
                <span className="text-emerald-700 font-bold">1. Received</span>
                <span className="text-slate-700 font-bold">2. Cooking</span>
                <span>3. Ready</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 border-t border-slate-100 pt-3 text-left">
              <div className="font-semibold text-slate-800 mb-1">
                {completedOrder.orderType === 'dine-in'
                  ? `Delivering to Table ${completedOrder.tableNumber}`
                  : 'Takeout / Counter Pickup'}
              </div>
              <div className="text-[11px] text-slate-500">
                Paid with {completedOrder.paymentMethod.replace('_', ' ').toUpperCase()} ·{' '}
                <span className="font-bold text-slate-700">
                  {restaurant.currencySymbol}
                  {completedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setCompletedOrder(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Guest Wi-Fi Popup Modal */}
      {showWifiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Wifi className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">{t('wifiInfo')}</h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Network (SSID):</span>
                <span className="font-bold text-slate-800">{restaurant.wifiSsid}</span>
              </div>
              {restaurant.wifiPassword && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Password:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {restaurant.wifiPassword}
                  </span>
                </div>
              )}
            </div>

            {restaurant.wifiPassword && (
              <button
                onClick={copyWifiPassword}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {wifiCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Password Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Wi-Fi Password</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setShowWifiModal(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Document / Menu Sheet Lightbox */}
      {lightboxImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in">
          <div className="flex items-center justify-between text-white pb-3">
            <span className="text-xs font-bold text-slate-300">
              High-Definition Menu Sheet
            </span>
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto p-2">
            <img
              src={lightboxImageUrl}
              alt="Fullscreen Menu"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
