import React, { useState, useEffect } from 'react';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { QRCodeList } from './components/QRCodeList';
import { QRCodeCreatorModal } from './components/QRCodeCreatorModal';
import { QRCodeCustomizer } from './components/QRCodeCustomizer';
import { MenuManager } from './components/MenuManager';
import { KitchenOrdersView } from './components/KitchenOrdersView';
import { AnalyticsView } from './components/AnalyticsView';
import { CustomerMenuView } from './components/CustomerMenuView';
import { MobileDeviceFrame } from './components/MobileDeviceFrame';
import { PrintTableTentModal } from './components/PrintTableTentModal';
import {
  RestaurantProfile,
  MenuCategory,
  MenuItem,
  RestaurantQRCode,
  Order,
  OrderStatus,
} from './types';
import { StorageService, subscribeToLiveSync } from './services/storage';
import { UrlResolver } from './services/urlResolver';
import { Smartphone, Monitor, RotateCcw, Sparkles, ArrowLeft } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('qrcodes');
  const [restaurant, setRestaurant] = useState<RestaurantProfile>(StorageService.getRestaurant());
  const [categories, setCategories] = useState<MenuCategory[]>(StorageService.getCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(StorageService.getMenuItems());
  const [qrCodes, setQRCodes] = useState<RestaurantQRCode[]>(StorageService.getQRCodes());
  const [orders, setOrders] = useState<Order[]>(StorageService.getOrders());

  // Editing & modal states
  const [editingQRCode, setEditingQRCode] = useState<RestaurantQRCode | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [printTentQR, setPrintTentQR] = useState<RestaurantQRCode | null>(null);
  const [customerTableNumber, setCustomerTableNumber] = useState<number>(4);
  const [isCustomerDirectMode, setIsCustomerDirectMode] = useState<boolean>(false);

  // Auto-detect if customer opened the page via QR code scan or direct menu link
  useEffect(() => {
    const session = UrlResolver.detectCustomerSession();
    if (session.isCustomer) {
      setIsCustomerDirectMode(true);
      setActiveTab('customer');
      if (session.tableNumber) {
        setCustomerTableNumber(session.tableNumber);
      }
      if (session.qrId) {
        StorageService.incrementScanCount(session.qrId);
      }
    }
  }, []);

  // Subscribe to live cross-tab/preview synchronization
  useEffect(() => {
    const unsubscribe = subscribeToLiveSync((event) => {
      if (event.type === 'MENU_ITEMS_UPDATED') {
        setMenuItems(StorageService.getMenuItems());
      } else if (event.type === 'RESTAURANT_UPDATED') {
        setRestaurant(StorageService.getRestaurant());
      } else if (event.type === 'QR_CODES_UPDATED') {
        setQRCodes(StorageService.getQRCodes());
      } else if (event.type === 'ORDERS_UPDATED' || event.type === 'NEW_ORDER_PLACED') {
        setOrders(StorageService.getOrders());
      } else if (event.type === 'RESET_ALL') {
        setRestaurant(StorageService.getRestaurant());
        setCategories(StorageService.getCategories());
        setMenuItems(StorageService.getMenuItems());
        setQRCodes(StorageService.getQRCodes());
        setOrders(StorageService.getOrders());
      }
    });
    return unsubscribe;
  }, []);

  // Handle QR Code creation
  const handleCreateNewQR = (newQRPartial: Partial<RestaurantQRCode>) => {
    const newQR: RestaurantQRCode = {
      id: `qr_${Date.now()}`,
      restaurantId: restaurant.id,
      title: newQRPartial.title || 'Dynamic Restaurant Menu',
      type: newQRPartial.type || 'menu',
      tableNumber: newQRPartial.tableNumber,
      shortUrl: newQRPartial.shortUrl || `dineqr.io/g-${Math.random().toString(36).slice(2, 6)}`,
      scansCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      styling: newQRPartial.styling || {
        fgColor: '#1e3a2b',
        bgColor: '#ffffff',
        frameStyle: newQRPartial.type === 'table' ? 'table-card' : 'scan-me',
        frameText:
          newQRPartial.type === 'table'
            ? `TABLE ${newQRPartial.tableNumber || 1} · SCAN TO ORDER`
            : 'SCAN FOR DYNAMIC MENU',
        dotStyle: 'rounded',
        logoInCenter: true,
        size: 280,
      },
    };

    StorageService.createQRCode(newQR);
    setQRCodes(StorageService.getQRCodes());
    setIsCreatorOpen(false);
    setEditingQRCode(newQR);
    setActiveTab('qrcodes');
  };

  // Duplicate QR code
  const handleDuplicateQR = (qr: RestaurantQRCode) => {
    const duplicated: RestaurantQRCode = {
      ...qr,
      id: `qr_${Date.now()}`,
      title: `${qr.title} (Copy)`,
      shortUrl: `dineqr.io/copy-${Math.random().toString(36).slice(2, 6)}`,
      scansCount: 0,
      createdAt: new Date().toISOString(),
    };
    StorageService.createQRCode(duplicated);
    setQRCodes(StorageService.getQRCodes());
  };

  // Delete QR code
  const handleDeleteQR = (id: string) => {
    if (confirm('Delete this QR code? Any existing printed standees will no longer link.')) {
      StorageService.deleteQRCode(id);
      setQRCodes(StorageService.getQRCodes());
    }
  };

  // Save QR and Restaurant Profile
  const handleSaveCustomizer = (
    updatedQR: RestaurantQRCode,
    updatedRestaurant: RestaurantProfile
  ) => {
    StorageService.updateQRCode(updatedQR);
    StorageService.saveRestaurant(updatedRestaurant);
    setQRCodes(StorageService.getQRCodes());
    setRestaurant(updatedRestaurant);
  };

  // Update Menu items
  const handleUpdateMenuItems = (updatedItems: MenuItem[]) => {
    StorageService.saveMenuItems(updatedItems);
    setMenuItems(updatedItems);
  };

  // Update Order Status in KDS
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    StorageService.updateOrderStatus(orderId, status);
    setOrders(StorageService.getOrders());
  };

  // Simulate a live customer scan & order
  const handleSimulateNewOrder = () => {
    const randomDish = menuItems[Math.floor(Math.random() * menuItems.length)];
    const randomTable = Math.floor(1 + Math.random() * 15);
    const guestNames = ['Sophia Lin', 'Mateo Rossi', 'Hanna Becker', 'Liam Johnson', 'Amina Idris'];
    const randomGuest = guestNames[Math.floor(Math.random() * guestNames.length)];

    const simulated: Order = {
      id: `ord_${Date.now().toString().slice(-4)}`,
      orderNumber: `#${Math.floor(110 + Math.random() * 890)}`,
      restaurantId: restaurant.id,
      tableNumber: randomTable,
      orderType: 'dine-in',
      customerName: randomGuest,
      customerPhone: '+1 (555) 789-0123',
      items: [
        {
          menuItemId: randomDish.id,
          name: randomDish.name,
          price: randomDish.price,
          quantity: 1,
        },
      ],
      subtotal: randomDish.price,
      tax: Number(((randomDish.price * restaurant.taxRatePercent) / 100).toFixed(2)),
      tip: 3.50,
      total: Number((randomDish.price * 1.085 + 3.50).toFixed(2)),
      paymentMethod: 'apple_pay',
      paymentStatus: 'paid',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedMinutes: 10,
    };

    StorageService.createOrder(simulated);
    setOrders(StorageService.getOrders());
  };

  const newOrdersCount = orders.filter((o) => o.status === 'new').length;

  // If customer accessed via QR Code scan or direct scan URL, render the native responsive mobile customer interface directly!
  if (isCustomerDirectMode) {
    return (
      <div className="min-h-screen bg-[#ebedf0] flex flex-col font-sans relative">
        {/* Full-width Responsive Mobile Customer Menu View */}
        <div className="flex-1 max-w-md w-full mx-auto bg-[#ebedf0] min-h-screen">
          <CustomerMenuView
            restaurant={restaurant}
            categories={categories}
            menuItems={menuItems}
            initialTableNumber={customerTableNumber}
            onOrderCreated={(order) => {
              setOrders(StorageService.getOrders());
            }}
            isStandalone={true}
          />
        </div>

        {/* Discreet Manager Return Badge for Demo Testing */}
        <button
          onClick={() => {
            setIsCustomerDirectMode(false);
            setActiveTab('qrcodes');
          }}
          className="fixed bottom-2 right-2 z-50 bg-black/30 hover:bg-black/80 text-white/60 hover:text-white px-2 py-1 rounded-md text-[10px] font-mono backdrop-blur-xs transition-all cursor-pointer"
          title="Return to Manager Console"
        >
          Manager ⚙️
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 3-Zone Top Navbar compliant with Frontend Design Constitution */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'qrcodes') setEditingQRCode(null);
        }}
        onCreateQR={() => setIsCreatorOpen(true)}
        newOrdersCount={newOrdersCount}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If Customizer is active (from editing a QR code) */}
        {editingQRCode ? (
          <QRCodeCustomizer
            qrCode={editingQRCode}
            restaurant={restaurant}
            categories={categories}
            menuItems={menuItems}
            onBack={() => setEditingQRCode(null)}
            onSave={handleSaveCustomizer}
            onUpdateMenuItems={handleUpdateMenuItems}
          />
        ) : activeTab === 'qrcodes' ? (
          <QRCodeList
            qrCodes={qrCodes}
            restaurant={restaurant}
            onCreateNew={() => setIsCreatorOpen(true)}
            onEdit={(qr) => setEditingQRCode(qr)}
            onOpenCustomerPreview={(tableNum) => {
              setCustomerTableNumber(tableNum || 4);
              setActiveTab('customer');
            }}
            onDelete={handleDeleteQR}
            onDuplicate={handleDuplicateQR}
            onPrintTent={(qr) => setPrintTentQR(qr)}
          />
        ) : activeTab === 'menu' ? (
          <MenuManager
            restaurant={restaurant}
            categories={categories}
            menuItems={menuItems}
            onUpdateItems={handleUpdateMenuItems}
            onUpdateRestaurant={(updated) => {
              StorageService.saveRestaurant(updated);
              setRestaurant(updated);
            }}
            onPreviewCustomerMenu={() => setActiveTab('customer')}
            onOpenCustomizer={() => {
              const mainQR = qrCodes[0];
              if (mainQR) setEditingQRCode(mainQR);
            }}
          />
        ) : activeTab === 'kitchen' ? (
          <KitchenOrdersView
            orders={orders}
            restaurant={restaurant}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onSimulateNewOrder={handleSimulateNewOrder}
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsView
            qrCodes={qrCodes}
            orders={orders}
            restaurant={restaurant}
          />
        ) : activeTab === 'customer' ? (
          /* Full Customer Mobile View Simulation */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-700" />
                  <span>Customer Mobile Dining Experience</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  This is the exact responsive interface customers see when scanning table QR codes on iPhone & Android.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const first = qrCodes.find((q) => q.type === 'table') || qrCodes[0];
                    if (first) setPrintTentQR(first);
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Print Table QR Code
                </button>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Back to Menu Manager
                </button>
              </div>
            </div>

            {/* Centered Realistic Smartphone Frame */}
            <div className="py-4 flex justify-center">
              <MobileDeviceFrame
                width={390}
                height={780}
                restaurantName={restaurant.name}
              >
                <CustomerMenuView
                  restaurant={restaurant}
                  categories={categories}
                  menuItems={menuItems}
                  initialTableNumber={customerTableNumber}
                  onOrderCreated={(order) => {
                    setOrders(StorageService.getOrders());
                  }}
                  isStandalone={true}
                />
              </MobileDeviceFrame>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 DineQR · Dynamic Restaurant QR Codes & Real-Time Ordering System
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (confirm('Reset all demo data back to initial Guansa Coffee Hub state?')) {
                  StorageService.resetAllToDefault();
                  window.location.reload();
                }
              }}
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
            <span>·</span>
            <span>Zero-App Instant Web Ordering</span>
          </div>
        </div>
      </footer>

      {/* QR Code Creation Modal */}
      {isCreatorOpen && (
        <QRCodeCreatorModal
          onClose={() => setIsCreatorOpen(false)}
          onCreate={handleCreateNewQR}
        />
      )}

      {/* Print Table Tent Standee Modal */}
      {printTentQR && (
        <PrintTableTentModal
          qrCode={printTentQR}
          restaurant={restaurant}
          onClose={() => setPrintTentQR(null)}
        />
      )}
    </div>
  );
}
