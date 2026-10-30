import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Check,
  X,
  UtensilsCrossed,
  DollarSign,
  Clock,
  Flame,
  Leaf,
  Globe,
  Tag,
  AlertCircle,
  Eye,
  Upload,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Palette,
} from 'lucide-react';
import {
  MenuItem,
  MenuCategory,
  RestaurantProfile,
  LanguageCode,
  UploadedMenuFile,
  MenuDisplayMode,
} from '../types';
import { StorageService } from '../services/storage';
import { TranslatorService } from '../services/translator';

interface MenuManagerProps {
  restaurant: RestaurantProfile;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  onUpdateItems: (items: MenuItem[]) => void;
  onUpdateRestaurant?: (restaurant: RestaurantProfile) => void;
  onPreviewCustomerMenu: () => void;
  onOpenCustomizer?: () => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  restaurant,
  categories,
  menuItems,
  onUpdateItems,
  onUpdateRestaurant,
  onPreviewCustomerMenu,
  onOpenCustomizer,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showDocSection, setShowDocSection] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    categoryId: categories[0]?.id || 'cat_hot_drinks',
    description: '',
    price: 12.00,
    originalPrice: undefined,
    imageUrl: '/src/assets/images/menu_artisan_pizza_1793349863039.jpg',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isHalal: false,
    isSpicy: false,
    isPopular: false,
    prepTimeMinutes: 10,
    calories: 450,
  });

  // Filtered Items
  const filteredItems = menuItems.filter((item) => {
    if (activeCategory !== 'all' && item.categoryId !== activeCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Toggle Availability
  const handleToggleAvailability = (itemId: string) => {
    const updated = menuItems.map((i) =>
      i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i
    );
    onUpdateItems(updated);
    StorageService.toggleItemAvailability(itemId);
  };

  // Quick Inline Price Edit
  const handleSaveInlinePrice = (itemId: string) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      const updated = menuItems.map((i) =>
        i.id === itemId ? { ...i, price: Number(newPrice.toFixed(2)) } : i
      );
      onUpdateItems(updated);
      StorageService.quickUpdatePrice(itemId, newPrice);
    }
    setInlinePriceId(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsAddModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: `item_${Date.now()}`,
      name: '',
      categoryId: activeCategory === 'all' ? categories[0]?.id : activeCategory,
      description: '',
      price: 9.50,
      imageUrl: '/src/assets/images/menu_artisan_pizza_1793349863039.jpg',
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isHalal: false,
      isSpicy: false,
      isPopular: false,
      prepTimeMinutes: 12,
      calories: 500,
    });
    setIsAddModalOpen(true);
  };

  // Save Modal Form
  const handleSaveForm = () => {
    if (!formData.name?.trim()) return;

    if (editingItem) {
      const updated = menuItems.map((i) =>
        i.id === editingItem.id ? ({ ...i, ...formData } as MenuItem) : i
      );
      onUpdateItems(updated);
      StorageService.updateMenuItem({ ...editingItem, ...formData } as MenuItem);
    } else {
      const newItem: MenuItem = {
        ...(formData as MenuItem),
        id: `item_${Date.now()}`,
      };
      const updated = [newItem, ...menuItems];
      onUpdateItems(updated);
      StorageService.addMenuItem(newItem);
    }
    setIsAddModalOpen(false);
  };

  // Delete Item
  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to remove this item from the dynamic menu?')) {
      const updated = menuItems.filter((i) => i.id !== itemId);
      onUpdateItems(updated);
      StorageService.deleteMenuItem(itemId);
    }
  };

  // Auto-translate using TranslatorService
  const handleAutoTranslate = async () => {
    if (!formData.name) return;
    setIsTranslating(true);
    const translations = await TranslatorService.autoTranslateText(
      formData.name,
      formData.description || '',
      ['es', 'fr', 'de', 'it', 'ar', 'zh', 'ja', 'am']
    );
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...(prev.translations || {}),
        ...translations,
      },
    }));
    setIsTranslating(false);
  };

  const inStockCount = menuItems.filter((i) => i.isAvailable).length;
  const soldOutCount = menuItems.length - inStockCount;

  const handleUploadMenuDocs = (files: FileList | null) => {
    if (!files || files.length === 0 || !onUpdateRestaurant) return;
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
        const updated = {
          ...restaurant,
          uploadedMenuFiles: [...(restaurant.uploadedMenuFiles || []), newFile],
        };
        onUpdateRestaurant(updated);
        StorageService.saveRestaurant(updated);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateRestaurant) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updated = { ...restaurant, logoUrl: dataUrl };
      onUpdateRestaurant(updated);
      StorageService.saveRestaurant(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (id: string) => {
    if (!onUpdateRestaurant) return;
    const updated = {
      ...restaurant,
      uploadedMenuFiles: restaurant.uploadedMenuFiles.filter((f) => f.id !== id),
    };
    onUpdateRestaurant(updated);
    StorageService.saveRestaurant(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Menu Items</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {menuItems.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across 5 categories</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Live In Stock</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
            {inStockCount}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Available for customer orders</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Scanned Menu Files</div>
          <div className="text-2xl font-extrabold text-sky-700 mt-1 tabular-nums">
            {restaurant.uploadedMenuFiles?.length || 0}
          </div>
          <div className="text-[11px] text-sky-600 mt-1">PDF & Image sheets active</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Avg Item Price</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {restaurant.currencySymbol}
            {(
              menuItems.reduce((acc, curr) => acc + curr.price, 0) /
              (menuItems.length || 1)
            ).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Real-time dynamic pricing</div>
        </div>
      </div>

      {/* Scanned Menu Documents & Brand Logo Quick Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
              {restaurant.logoUrl ? (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <UtensilsCrossed className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{restaurant.name} Brand Assets</h3>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase">
                  {restaurant.menuDisplayMode} mode
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your menu PDF, printed image sheets, and restaurant logo displayed to customers after scanning.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={(e) => handleUploadMenuDocs(e.target.files)}
              className="hidden"
            />
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadLogo}
              className="hidden"
            />

            <button
              onClick={() => logoInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Change Logo</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Menu PDF / Image</span>
            </button>
          </div>
        </div>

        {/* Uploaded Menu Sheets Strip */}
        {restaurant.uploadedMenuFiles && restaurant.uploadedMenuFiles.length > 0 && (
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Active Scans:</span>
            {restaurant.uploadedMenuFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-1.5 pr-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {file.type === 'pdf' ? (
                    <FileText className="w-4 h-4 text-rose-500" />
                  ) : (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                  {file.caption || file.name}
                </span>
                <button
                  onClick={() => handleRemoveDoc(file.id)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar: Title, Search, Category Tabs, Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Menu Catalog & Real-Time Item Pricing
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify pricing and item availability instantly. Changes appear immediately on customer phones.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onPreviewCustomerMenu}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Mobile View</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish, ingredients..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Items Table / High-Density List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Item & Ingredients</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4">Dietary</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !item.isAvailable ? 'bg-slate-50/40 text-slate-500' : ''
                  }`}
                >
                  {/* Photo & Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.isPopular && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md font-bold">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] line-clamp-1 max-w-sm mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {categories.find((c) => c.id === item.categoryId)?.name || 'General'}
                  </td>

                  {/* Real-time Inline Price Edit */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                    {inlinePriceId === item.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">
                          {restaurant.currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="0.25"
                          autoFocus
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInlinePrice(item.id);
                            if (e.key === 'Escape') setInlinePriceId(null);
                          }}
                          className="w-16 px-1.5 py-0.5 border border-slate-300 rounded font-bold text-xs"
                        />
                        <button
                          onClick={() => handleSaveInlinePrice(item.id)}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setInlinePriceId(item.id);
                          setTempPrice(item.price.toString());
                        }}
                        className="flex items-center gap-1 text-slate-900 hover:text-emerald-700 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors cursor-pointer group"
                        title="Click to quickly modify price"
                      >
                        <span className="tabular-nums">
                          {restaurant.currencySymbol}
                          {item.price.toFixed(2)}
                        </span>
                        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400" />
                      </button>
                    )}
                  </td>

                  {/* Instant 1-Click Availability Toggle */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span>{item.isAvailable ? 'In Stock' : 'Sold Out'}</span>
                    </button>
                  </td>

                  {/* Dietary Icons */}
                  <td className="py-3 px-4 text-slate-500">
                    <div className="flex items-center gap-1.5 text-xs">
                      {item.isVegetarian && <span title="Vegetarian">🌱</span>}
                      {item.isVegan && <span title="Vegan">🌿</span>}
                      {item.isGlutenFree && <span title="Gluten-Free">🌾</span>}
                      {item.isHalal && <span title="Halal">✨</span>}
                      {item.isSpicy && <span title="Spicy">🌶️</span>}
                      {!item.isVegetarian &&
                        !item.isVegan &&
                        !item.isGlutenFree &&
                        !item.isHalal &&
                        !item.isSpicy && <span className="text-slate-300">-</span>}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Edit Dish & Translations"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Delete from menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Dish Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Menu Dish' : 'Add New Dish to Menu'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Item Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Dish / Beverage Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Truffle Mushroom Artisan Pizza"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Category & Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Price ({restaurant.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.price || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Description & AI Auto-Translate Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">
                    Description & Ingredients
                  </label>
                  <button
                    onClick={handleAutoTranslate}
                    disabled={isTranslating || !formData.name}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md cursor-pointer disabled:opacity-50"
                  >
                    <Globe className="w-3 h-3" />
                    <span>{isTranslating ? 'Translating...' : 'Auto-Translate (9 Languages)'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients, culinary notes, preparation style..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              {/* Image URL & Preset Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  High-Resolution Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                {/* Presets */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400">Quick Presets:</span>
                  {[
                    { label: 'Pizza', url: '/src/assets/images/menu_artisan_pizza_1793349863039.jpg' },
                    { label: 'Burger', url: '/src/assets/images/menu_gourmet_burger_1793349864098.jpg' },
                    { label: 'Coffee', url: '/src/assets/images/menu_specialty_coffee_1793349862997.jpg' },
                    { label: 'Sandwich', url: '/src/assets/images/menu_club_sandwich_1793349864485.jpg' },
                    { label: 'Drink', url: '/src/assets/images/menu_fruit_smoothie_1793349864438.jpg' },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: p.url })}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-semibold text-slate-700 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Flags */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-700 font-bold mb-2">
                  Dietary & Lifestyle Tags:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'isVegetarian', label: '🌱 Vegetarian' },
                    { key: 'isVegan', label: '🌿 Vegan' },
                    { key: 'isGlutenFree', label: '🌾 Gluten-Free' },
                    { key: 'isHalal', label: '✨ Halal' },
                    { key: 'isSpicy', label: '🌶️ Spicy' },
                    { key: 'isPopular', label: '🔥 Chef Special' },
                  ].map((tag) => (
                    <label
                      key={tag.key}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(formData[tag.key as keyof MenuItem])}
                        onChange={(e) =>
                          setFormData({ ...formData, [tag.key]: e.target.checked })
                        }
                        className="rounded text-emerald-600"
                      />
                      <span className="text-slate-800 font-medium">{tag.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prep time & Calories */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.prepTimeMinutes || 10}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prepTimeMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={formData.calories || 400}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calories: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveForm}
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                {editingItem ? 'Save Changes' : 'Add to Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
