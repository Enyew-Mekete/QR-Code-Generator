import { RestaurantQRCode } from '../types';

export const UrlResolver = {
  /**
   * Resolves the real live base URL of the running application.
   * Auto-detects Cloud Run dev/pre URLs, localhost, GitHub Pages, or custom domains.
   */
  getBaseAppUrl(customBaseUrl?: string): string {
    if (customBaseUrl && customBaseUrl.trim() !== '') {
      let url = customBaseUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      return url.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined' && window.location) {
      // Auto-detect current active origin and base path (e.g., for GitHub Pages /subpath/)
      const origin = window.location.origin;
      const pathname = window.location.pathname.replace(/\/+$/, '');
      return `${origin}${pathname}`;
    }

    return 'https://ais-dev-4hevqikux3u2i7i7wluw6u-98264305223.europe-west2.run.app';
  },

  /**
   * Generates the real, scan-testable URL for a given QR code.
   * When scanned with any smartphone camera, it immediately routes to the Customer Menu!
   */
  getScanUrl(qr: RestaurantQRCode, customBaseUrl?: string): string {
    const base = this.getBaseAppUrl(customBaseUrl);
    const params = new URLSearchParams();
    params.set('mode', 'customer');
    if (qr.tableNumber) {
      params.set('table', qr.tableNumber.toString());
    }
    if (qr.id) {
      params.set('qr', qr.id);
    }
    if (qr.type) {
      params.set('type', qr.type);
    }

    return `${base}?${params.toString()}`;
  },

  /**
   * Detects whether the current browser session was opened via a QR scan or customer link.
   */
  detectCustomerSession(): {
    isCustomer: boolean;
    tableNumber?: number;
    qrId?: string;
    orderType?: 'dine-in' | 'takeout';
  } {
    if (typeof window === 'undefined' || !window.location) {
      return { isCustomer: false };
    }

    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    const isCustomerParam = searchParams.get('mode') === 'customer';
    const hasTableParam = searchParams.has('table');
    const hasScanParam = searchParams.has('scan') || searchParams.has('qr');
    const isMenuHash = hash.includes('customer') || hash.includes('menu');

    const isCustomer = isCustomerParam || hasTableParam || hasScanParam || isMenuHash;

    const tableStr = searchParams.get('table');
    const tableNumber = tableStr ? parseInt(tableStr, 10) : undefined;
    const qrId = searchParams.get('qr') || undefined;
    const typeParam = searchParams.get('type');
    const orderType = typeParam === 'takeout' ? 'takeout' : 'dine-in';

    return {
      isCustomer,
      tableNumber,
      qrId,
      orderType,
    };
  },
};
