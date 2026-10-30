export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'ar' | 'zh' | 'ja' | 'am';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export interface CustomizationOption {
  id: string;
  name: string;
  required: boolean;
  choices: {
    id: string;
    label: string;
    priceDelta: number;
  }[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isHalal?: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  prepTimeMinutes?: number;
  calories?: number;
  allergens?: string[];
  options?: CustomizationOption[];
  translations?: Partial<Record<LanguageCode, { name: string; description: string }>>;
}

export interface MenuCategory {
  id: string;
  name: string;
  iconName: string;
  displayOrder: number;
  translations?: Partial<Record<LanguageCode, string>>;
}

export type QRFrameStyle = 'none' | 'scan-me' | 'table-card' | 'badge-top' | 'minimal-border';
export type QRDotStyle = 'square' | 'rounded' | 'dots';

export interface QRCodeStyling {
  fgColor: string;
  bgColor: string;
  frameStyle: QRFrameStyle;
  frameText: string;
  dotStyle: QRDotStyle;
  logoInCenter: boolean;
  customLogoUrl?: string; // Uploaded custom logo file (image or SVG)
  logoSizePercent?: number; // 15 to 30% of QR size
  size: number;
}

export interface RestaurantQRCode {
  id: string;
  restaurantId: string;
  title: string;
  type: 'menu' | 'table' | 'takeout' | 'wifi' | 'feedback';
  tableNumber?: number;
  shortUrl: string;
  scansCount: number;
  lastScanAt?: string;
  status: 'active' | 'paused';
  createdAt: string;
  expiresInDays?: number;
  styling: QRCodeStyling;
}

export interface UploadedMenuFile {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  url: string; // Base64 data URL or relative URL
  sizeFormatted?: string;
  uploadedAt: string;
  caption?: string;
}

export type MenuDisplayMode = 'interactive' | 'document' | 'hybrid';

export interface RestaurantProfile {
  id: string;
  name: string;
  tagline: string;
  description: string;
  website: string;
  phone: string;
  address: string;
  wifiSsid: string;
  wifiPassword?: string;
  currencySymbol: string;
  currencyCode: string;
  taxRatePercent: number;
  logoUrl: string; // Brand logo for welcome screen, header, and default QR logo
  coverImageUrl: string;
  themeColor: string;
  welcomeMessage: string;
  allowOnlineOrders: boolean;
  allowTableDelivery: boolean;
  allowPickup: boolean;
  acceptedPaymentMethods: ('apple_pay' | 'google_pay' | 'credit_card' | 'counter_cash')[];
  menuDisplayMode: MenuDisplayMode;
  uploadedMenuFiles: UploadedMenuFile[];
  showImagesInGrid?: boolean;
}

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'apple_pay' | 'google_pay' | 'credit_card' | 'counter_cash';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  tableNumber?: number;
  orderType: 'dine-in' | 'takeout';
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending';
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  estimatedMinutes: number;
}
