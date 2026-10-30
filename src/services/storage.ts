import { RestaurantProfile, MenuCategory, MenuItem, RestaurantQRCode, Order, OrderStatus } from '../types';
import { INITIAL_RESTAURANT, INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_QR_CODES, INITIAL_ORDERS } from '../data/initialData';

const STORAGE_KEYS = {
  RESTAURANT: 'dineqr_restaurant_profile_v1',
  CATEGORIES: 'dineqr_menu_categories_v1',
  ITEMS: 'dineqr_menu_items_v1',
  QR_CODES: 'dineqr_qr_codes_v1',
  ORDERS: 'dineqr_customer_orders_v1',
};

// BroadcastChannel for instant real-time sync across preview & tabs
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('dineqr_live_channel');
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }
}

export const subscribeToLiveSync = (callback: (event: { type: string; payload?: unknown }) => void) => {
  if (!syncChannel) return () => {};
  const handler = (event: MessageEvent) => {
    callback(event.data);
  };
  syncChannel.addEventListener('message', handler);
  return () => {
    syncChannel?.removeEventListener('message', handler);
  };
};

const notifySync = (type: string, payload?: unknown) => {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch (e) {
      console.warn('Sync postMessage failed', e);
    }
  }
};

export const StorageService = {
  getRestaurant(): RestaurantProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESTAURANT);
      if (data) {
        const parsed: RestaurantProfile = JSON.parse(data);
        // Ensure uploadedMenuFiles is populated if missing or if pointing to old raw screenshot
        if (!parsed.uploadedMenuFiles || parsed.uploadedMenuFiles.length === 0) {
          parsed.uploadedMenuFiles = INITIAL_RESTAURANT.uploadedMenuFiles;
        } else if (parsed.uploadedMenuFiles[0]?.url?.includes('image_6c71af98.png')) {
          parsed.uploadedMenuFiles[0].url = './assets/guansa_menu_sheet.png';
          parsed.uploadedMenuFiles[0].name = 'Guansa Coffee Hub - Official Menu Sheet.png';
        }

        // Ensure logoUrl is crisp clean logo
        if (!parsed.logoUrl || parsed.logoUrl.includes('image_6c71af98.png')) {
          parsed.logoUrl = './assets/guansa_logo.png';
        }

        // Align with official Guansa lookbook sample
        if (!parsed.tagline || parsed.tagline === 'GOOD FOOD · GOOD MOOD') {
          parsed.tagline = 'Guansa Coffee Menu';
        }
        if (!parsed.themeColor || parsed.themeColor === '#1e3a2b') {
          parsed.themeColor = '#3c4245';
        }
        if (!parsed.website) {
          parsed.website = 'https://guansa-maed-mu.vercel.app';
        }
        if (!parsed.currencySymbol || parsed.currencySymbol === '$') {
          parsed.currencySymbol = 'ብር';
          parsed.currencyCode = 'ETB';
        }

        return parsed;
      }
      return INITIAL_RESTAURANT;
    } catch {
      return INITIAL_RESTAURANT;
    }
  },

  saveRestaurant(restaurant: RestaurantProfile): void {
    localStorage.setItem(STORAGE_KEYS.RESTAURANT, JSON.stringify(restaurant));
    notifySync('RESTAURANT_UPDATED', restaurant);
  },

  getCategories(): MenuCategory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  saveCategories(categories: MenuCategory[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    notifySync('CATEGORIES_UPDATED', categories);
  },

  getMenuItems(): MenuItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return data ? JSON.parse(data) : INITIAL_MENU_ITEMS;
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  },

  saveMenuItems(items: MenuItem[]): void {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    notifySync('MENU_ITEMS_UPDATED', items);
  },

  updateMenuItem(updatedItem: MenuItem): void {
    const items = this.getMenuItems();
    const index = items.findIndex((i) => i.id === updatedItem.id);
    if (index !== -1) {
      items[index] = updatedItem;
      this.saveMenuItems(items);
    }
  },

  toggleItemAvailability(itemId: string): boolean {
    const items = this.getMenuItems();
    const item = items.find((i) => i.id === itemId);
    if (item) {
      item.isAvailable = !item.isAvailable;
      this.saveMenuItems(items);
      return item.isAvailable;
    }
    return false;
  },

  quickUpdatePrice(itemId: string, newPrice: number): void {
    const items = this.getMenuItems();
    const item = items.find((i) => i.id === itemId);
    if (item && !isNaN(newPrice) && newPrice >= 0) {
      item.price = Number(newPrice.toFixed(2));
      this.saveMenuItems(items);
    }
  },

  addMenuItem(item: MenuItem): void {
    const items = this.getMenuItems();
    items.unshift(item);
    this.saveMenuItems(items);
  },

  deleteMenuItem(itemId: string): void {
    const items = this.getMenuItems().filter((i) => i.id !== itemId);
    this.saveMenuItems(items);
  },

  getQRCodes(): RestaurantQRCode[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QR_CODES);
      return data ? JSON.parse(data) : INITIAL_QR_CODES;
    } catch {
      return INITIAL_QR_CODES;
    }
  },

  saveQRCodes(qrCodes: RestaurantQRCode[]): void {
    localStorage.setItem(STORAGE_KEYS.QR_CODES, JSON.stringify(qrCodes));
    notifySync('QR_CODES_UPDATED', qrCodes);
  },

  createQRCode(qrCode: RestaurantQRCode): void {
    const list = this.getQRCodes();
    list.unshift(qrCode);
    this.saveQRCodes(list);
  },

  updateQRCode(updated: RestaurantQRCode): void {
    const list = this.getQRCodes();
    const index = list.findIndex((q) => q.id === updated.id);
    if (index !== -1) {
      list[index] = updated;
      this.saveQRCodes(list);
    }
  },

  deleteQRCode(id: string): void {
    const list = this.getQRCodes().filter((q) => q.id !== id);
    this.saveQRCodes(list);
  },

  incrementScanCount(id: string): void {
    const list = this.getQRCodes();
    const target = list.find((q) => q.id === id);
    if (target) {
      target.scansCount += 1;
      target.lastScanAt = new Date().toISOString();
      this.saveQRCodes(list);
    }
  },

  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  },

  saveOrders(orders: Order[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifySync('ORDERS_UPDATED', orders);
  },

  createOrder(order: Order): void {
    const orders = this.getOrders();
    orders.unshift(order);
    this.saveOrders(orders);
    notifySync('NEW_ORDER_PLACED', order);
  },

  updateOrderStatus(orderId: string, status: OrderStatus): void {
    const orders = this.getOrders();
    const target = orders.find((o) => o.id === orderId);
    if (target) {
      target.status = status;
      target.updatedAt = new Date().toISOString();
      this.saveOrders(orders);
    }
  },

  resetAllToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.RESTAURANT);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.QR_CODES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    notifySync('RESET_ALL');
  },
};
