import React, { useState, useEffect } from 'react';
import { 
  dataService 
} from './services/dataService';
import { soundEngine } from './services/audioService';
import { syncService } from './services/syncService';

import { AuthView } from './components/AuthView';
import { ManagerDashboard } from './components/ManagerDashboard';
import { BulkImportModal } from './components/BulkImportModal';

import { Header } from './components/Header';
import { BarcodeScannerBar } from './components/BarcodeScannerBar';
import { CartTable } from './components/CartTable';
import { AICrossSellBanner } from './components/AICrossSellBanner';
import { BillingSummary } from './components/BillingSummary';
import { MultiFaceCamera } from './components/MultiFaceCamera';
import { CustomerProfileBox } from './components/CustomerProfileBox';
import { CustomerAnalytics } from './components/CustomerAnalytics';
import { CustomerDisplay } from './components/CustomerDisplay';

import { SettingsModal } from './components/SettingsModal';
import { PaymentModal } from './components/PaymentModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { InvoiceModal } from './components/InvoiceModal';
import { NewProductModal } from './components/NewProductModal';
import { NewCustomerModal } from './components/NewCustomerModal';
import { RecentBillsDrawer } from './components/RecentBillsDrawer';
import { Boxes, FileSpreadsheet, Plus, Download } from 'lucide-react';

export function App() {
  // Routing: 'pos' (Cashier) or 'customer' (Customer Display Screen)
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/customer' || hash === '#/customer' || hash === '#customer') {
        return 'customer';
      }
    }
    return 'pos';
  });

  // Auth User Session & Current Interface Mode ('billing' | 'manager')
  const [currentUser, setCurrentUser] = useState(() => dataService.getAuthUser());
  const [currentMode, setCurrentMode] = useState(() => dataService.getAuthUser()?.role || 'billing');

  // Master state (Multi-Tenant Isolated)
  const [catalog, setCatalog] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [account, setAccount] = useState(null);

  // Active terminal state
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [extraDiscount, setExtraDiscount] = useState(0);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isRecentBillsOpen, setIsRecentBillsOpen] = useState(false);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomerInitialData, setNewCustomerInitialData] = useState(null);
  const [activeInvoiceModal, setActiveInvoiceModal] = useState(null);
  const [paymentData, setPaymentData] = useState(null); // { mode, billing }
  const [receiptData, setReceiptData] = useState(null); // { transaction, cart }

  // Detect URL Route changes (e.g. #/customer or /customer)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/customer' || hash === '#/customer' || hash === '#customer') {
        setCurrentRoute('customer');
      } else {
        setCurrentRoute('pos');
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Load tenant-isolated data whenever currentUser session changes
  useEffect(() => {
    const loadTenantData = async () => {
      if (!currentUser?.email) {
        setCatalog([]);
        setCustomers([]);
        setSalesHistory([]);
        setSettings(null);
        setAccount(null);
        setActiveCustomer(null);
        return;
      }

      const email = currentUser.email;
      const [loadedAcc, loadedCat, loadedCust, loadedSet, loadedSales] = await Promise.all([
        dataService.getAccountByEmail(email),
        dataService.getCatalog(email),
        dataService.getCustomers(email),
        dataService.getSettings(email),
        dataService.getSalesHistory(email)
      ]);

      setAccount(loadedAcc);
      setCatalog(loadedCat || []);
      setCustomers(loadedCust || []);
      setSettings(loadedSet);
      setSalesHistory(loadedSales || []);

      if (loadedCust && loadedCust.length > 0) {
        setActiveCustomer(loadedCust[0]);
      } else {
        setActiveCustomer(null);
      }
    };

    loadTenantData();
  }, [currentUser]);

  // Synchronize with Customer Display via BroadcastChannel & LocalStorage
  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let rankDiscountPct = 0;
    if (settings?.rankSystemEnabled !== false && activeCustomer && settings?.discountSlabs) {
      const matched = settings.discountSlabs.find(
        s => activeCustomer.rank >= s.rankMin && activeCustomer.rank <= s.rankMax
      );
      if (matched) rankDiscountPct = matched.discountPct;
    }

    const rankDiscountAmount = (subtotal * rankDiscountPct) / 100;

    const milestoneTarget = settings?.milestoneTargetAmount !== undefined && Number(settings.milestoneTargetAmount) > 0
      ? Number(settings.milestoneTargetAmount)
      : 10000;
    const milestoneDiscount = settings?.milestoneDiscountAmount !== undefined && Number(settings.milestoneDiscountAmount) >= 0
      ? Number(settings.milestoneDiscountAmount)
      : 500;
    const milestoneDiscountAmount = (settings?.milestoneEnabled !== false && subtotal >= milestoneTarget) ? milestoneDiscount : 0;

    const extraDiscountAmount = extraDiscount || 0;
    const totalDiscount = rankDiscountAmount + milestoneDiscountAmount + extraDiscountAmount;
    const totalPayable = Math.max(0, subtotal - totalDiscount);

    let paymentStatus = 'IDLE';
    let paidAmount = 0;
    let paymentMode = null;
    let invoiceNo = null;

    if (receiptData) {
      paymentStatus = 'SUCCESS';
      paidAmount = receiptData.transaction?.totalPaid || totalPayable;
      paymentMode = receiptData.transaction?.paymentMode || 'UPI';
      invoiceNo = receiptData.transaction?.invoiceNo;
    } else if (paymentData) {
      paymentStatus = 'PENDING';
      paymentMode = paymentData.mode;
    }

    syncService.publish({
      customerName: activeCustomer?.name || null,
      customerId: activeCustomer?.id || null,
      customerAvatar: activeCustomer?.avatar || null,
      customerRank: activeCustomer?.rank || 1,
      customerTier: activeCustomer?.tier || "Member",
      itemsCount: cart.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      discount: totalDiscount,
      totalPayable,
      paymentStatus,
      paymentMode,
      paidAmount,
      invoiceNo,
      customQrImage: settings?.customQrImage || null,
      upiId: settings?.upiId || "smartmart.ai@icici"
    });
  }, [activeCustomer, cart, extraDiscount, paymentData, receiptData, settings]);

  // Customer switch / recognize handler
  const handleSelectCustomer = (customer, autoVoice = true) => {
    setActiveCustomer(customer);
    if (autoVoice && settings?.voiceGreetingEnabled) {
      const greeting = customer.visits <= 1
        ? `Welcome to SmartMart, ${customer.salutation || customer.name}! Enjoy member discounts today.`
        : `Welcome back, ${customer.salutation || customer.name}! Today is your ${customer.visits}th visit.`;
      
      soundEngine.speak(greeting);
    }
  };

  // Cart operations
  const handleAddToCart = (product) => {
    soundEngine.playScannerBeep();
    const existingIndex = cart.findIndex(i => i.id === product.id);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        soundEngine.playErrorBuzz();
        alert(`Cannot add more ${product.name}. Stock limit reached (${product.stock} units).`);
        return;
      }

      const updated = [...cart];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: currentQty + 1
      };
      setCart(updated);
    } else {
      if (product.stock <= 0) {
        soundEngine.playErrorBuzz();
        alert(`${product.name} is currently out of stock.`);
        return;
      }
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (productId, delta) => {
    const updated = cart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock) {
          soundEngine.playErrorBuzz();
          alert(`Only ${item.stock} units available in stock.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean);

    soundEngine.playScannerBeep();
    setCart(updated);
  };

  const handleUpdatePrice = (productId, newPrice) => {
    soundEngine.playScannerBeep();
    setCart(cart.map(item => {
      if (item.id === productId) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const handleRemoveItem = (productId) => {
    soundEngine.playScannerBeep();
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleClearCart = () => {
    soundEngine.playScannerBeep();
    setCart([]);
  };

  // Payment triggers
  const handleInitiatePayment = (mode, billing) => {
    soundEngine.playScannerBeep();
    setPaymentData({ mode, billing });
  };

  // Payment success handler
  const handlePaymentSuccess = async (transactionResult) => {
    // 1. Deduct stock from catalog
    let updatedCatalog = [...catalog];
    for (const cartItem of cart) {
      updatedCatalog = await dataService.updateProductStock(cartItem.id, -cartItem.quantity);
    }
    setCatalog(updatedCatalog);

    // 2. Record sale
    const saleRecord = {
      ...transactionResult,
      id: `TXN-${Date.now().toString().slice(-6)}`,
      customerName: activeCustomer?.name || "Walk-in Guest",
      customerId: activeCustomer?.id || "GUEST",
      itemsCount: cart.reduce((s, i) => s + i.quantity, 0),
      items: cart.map(i => ({
        name: i.name,
        qty: i.quantity,
        price: i.price,
        total: i.quantity * i.price
      }))
    };
    const updatedSales = await dataService.recordSale(saleRecord);
    setSalesHistory(updatedSales);

    // 3. Update customer history if active customer
    if (activeCustomer) {
      const rankPct = (settings?.rankSystemEnabled !== false)
        ? (activeCustomer.rank <= 5 ? 20 : (activeCustomer.rank <= 15 ? 15 : 10))
        : 0;

      const updatedCustomers = await dataService.updateCustomerHistory(activeCustomer.id, {
        id: saleRecord.id,
        invoiceNo: saleRecord.invoiceNo,
        date: saleRecord.date,
        items: saleRecord.items,
        subtotal: saleRecord.subtotal,
        rankDiscountPct: rankPct,
        rankDiscountAmount: saleRecord.rankDiscountAmount || 0,
        milestoneDiscountAmount: saleRecord.milestoneDiscountAmount || 0,
        extraDiscountAmount: saleRecord.extraDiscountAmount || 0,
        totalPaid: saleRecord.totalPaid,
        paymentMode: saleRecord.paymentMode
      });
      setCustomers(updatedCustomers);

      const refreshedActive = updatedCustomers.find(c => c.id === activeCustomer.id);
      if (refreshedActive) {
        setActiveCustomer(refreshedActive);
      }
    }

    // 4. Save current cart copy for thermal receipt modal
    const cartCopy = [...cart];

    // 5. Close payment modal and launch Thermal Receipt
    setPaymentData(null);
    setReceiptData({
      transaction: saleRecord,
      cart: cartCopy
    });

    // 6. Clear cart & extra discount for the next bill
    setCart([]);
    setExtraDiscount(0);
  };

  // Add Product to Catalog
  const handleAddProduct = async (newProduct) => {
    const updated = [newProduct, ...catalog];
    await dataService.saveCatalog(updated);
    setCatalog(updated);
  };

  // Add Customer
  const handleAddCustomer = async (newCustomer) => {
    const updated = await dataService.addCustomer(newCustomer);
    setCustomers(updated);
    setActiveCustomer(newCustomer);
  };

  // Update Settings
  const handleSaveSettings = async (newSettings) => {
    await dataService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Reset Daily Sales / Day End
  const handleResetDailySales = async () => {
    const result = await dataService.clearDailySales();
    setSalesHistory([]);
    if (result.updatedSettings) {
      setSettings(result.updatedSettings);
    }
  };

  // Safe Logout: Completely clears session & active screen state
  const handleLogout = () => {
    dataService.clearAuthSession();
    setCurrentUser(null);
    setCurrentMode('billing');
    setCatalog([]);
    setCustomers([]);
    setSalesHistory([]);
    setSettings(null);
    setAccount(null);
    setActiveCustomer(null);
    setCart([]);
    soundEngine.speak("Logged out of SmartMart terminal.");
  };

  // Login Success Handler (Receives account & desired slide mode)
  const handleLoginSuccess = async (loggedAccount, selectedMode = 'billing') => {
    setCurrentUser(dataService.getAuthUser());
    setCurrentMode(selectedMode);
    setAccount(loggedAccount);
    const email = loggedAccount.email;
    const [c, cust, s, sl] = await Promise.all([
      dataService.getCatalog(email),
      dataService.getCustomers(email),
      dataService.getSettings(email),
      dataService.getSalesHistory(email)
    ]);
    setCatalog(c || []);
    setCustomers(cust || []);
    setSettings(s);
    setSalesHistory(sl || []);
  };

  // SCENARIO 1: RENDER CUSTOMER DISPLAY SCREEN IF ON /customer OR #/customer
  if (currentRoute === 'customer') {
    return (
      <CustomerDisplay 
        onBackToPos={() => {
          window.location.hash = '';
          setCurrentRoute('pos');
        }}
      />
    );
  }

  // SCENARIO 2: RENDER AUTHENTICATION VIEW IF USER IS NOT LOGGED IN
  if (!currentUser) {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // SCENARIO 3: RENDER MANAGER DASHBOARD IF CURRENT MODE IS 'manager'
  if (currentMode === 'manager') {
    return (
      <>
        <ManagerDashboard
          account={account}
          settings={settings}
          catalog={catalog}
          salesHistory={salesHistory}
          onUpdateCatalog={async (newCat) => {
            setCatalog(newCat);
            await dataService.saveCatalog(newCat);
          }}
          onSaveSettings={handleSaveSettings}
          onResetDailySales={handleResetDailySales}
          onOpenBulkImport={() => setIsBulkImportOpen(true)}
          onOpenNewProductModal={() => setIsNewProductOpen(true)}
          onSwitchToBilling={() => setCurrentMode('billing')}
          onLogout={handleLogout}
        />

        {/* Bulk Import Modal */}
        <BulkImportModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          onImportSuccess={async () => {
            const fresh = await dataService.getCatalog();
            setCatalog(fresh);
          }}
        />

        {/* Add Product Modal */}
        <NewProductModal
          isOpen={isNewProductOpen}
          onClose={() => setIsNewProductOpen(false)}
          onAddProduct={handleAddProduct}
        />
      </>
    );
  }

  // SCENARIO 4: RENDER BILLING COUNTER TERMINAL
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
      {/* Top Header Navigation */}
      <Header 
        settings={settings}
        activeCustomer={activeCustomer}
        currentMode={currentMode}
        onOpenRecentBills={() => setIsRecentBillsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onOpenCustomerDisplay={() => {
          window.location.hash = '#/customer';
          setCurrentRoute('customer');
        }}
      />

      {/* Main Two-Column Layout */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: POS Operations & Cart (7 of 12 cols) */}
        <section className="lg:col-span-7 flex flex-col space-y-4">
          {/* Search / Barcode Bar & Category Pills */}
          <BarcodeScannerBar
            catalog={catalog}
            onAddToCart={handleAddToCart}
            onOpenNewProductModal={() => setIsNewProductOpen(true)}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Current Cart Items Table */}
          <CartTable
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdatePrice={handleUpdatePrice}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />

          {/* FIRST-TIME USER ONBOARDING: DISPLAY BULK IMPORT INSTRUCTIONS RIGHT BELOW CART WHEN CATALOG IS 0 */}
          {catalog.length === 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/40 shadow-xl space-y-3.5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-purple-900/60 border border-purple-500/40 text-purple-300">
                    <Boxes className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      📦 Product Stock & Pricing Manager (First-Time Store Setup)
                    </h3>
                    <p className="text-xs text-purple-300/80">
                      Your store catalog is clean and empty. Upload your products via CSV, Excel (.xlsx/.xls) or PDF.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsBulkImportOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>📄 Download Sample Template</span>
                  </button>
                  <button
                    onClick={() => setIsBulkImportOpen(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Bulk Import (CSV / Excel / PDF)</span>
                  </button>
                  <button
                    onClick={() => setIsNewProductOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Product</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-cyan-300">Friendly Setup Guide:</p>
                <p className="text-slate-400 text-[11px]">
                  Click <strong>"Bulk Import (CSV / Excel / PDF)"</strong> to upload your own product list (CSV, Excel, or PDF) with smart auto-column matching, or download our sample template. Once initial items are added, ongoing stock and price editing will be available in the <strong>Manager Dashboard</strong>.
                </p>
              </div>
            </div>
          )}

          {/* AI Cross-Sell Banner */}
          <AICrossSellBanner
            cart={cart}
            activeCustomer={activeCustomer}
            catalog={catalog}
            onAddToCart={handleAddToCart}
          />

          {/* Billing Subtotal, Discounts & Payment Action Buttons */}
          <BillingSummary
            cart={cart}
            activeCustomer={activeCustomer}
            settings={settings}
            extraDiscount={extraDiscount}
            onUpdateExtraDiscount={setExtraDiscount}
            onInitiatePayment={handleInitiatePayment}
          />
        </section>

        {/* Right Column: AI Real Multi-Face Detection & Customer Profile (5 of 12 cols) */}
        <section className="lg:col-span-5 flex flex-col space-y-4">
          {/* Real Live AI Multi-Face Camera Feed with Overlay Canvas */}
          <MultiFaceCamera
            customers={customers}
            activeCustomer={activeCustomer}
            settings={settings}
            onSelectCustomer={(c) => handleSelectCustomer(c, true)}
            onOpenNewCustomerModalWithSnapshot={(data) => {
              setNewCustomerInitialData(data);
              setIsNewCustomerOpen(true);
            }}
          />

          {/* Unified Customer Profile & Search Box */}
          <CustomerProfileBox
            activeCustomer={activeCustomer}
            customers={customers}
            onSelectCustomer={(c) => handleSelectCustomer(c, true)}
            onOpenNewCustomerModal={() => {
              setNewCustomerInitialData(null);
              setIsNewCustomerOpen(true);
            }}
          />

          {/* Customer Past Purchase Analytics & Invoices */}
          <CustomerAnalytics
            activeCustomer={activeCustomer}
            cart={cart}
            settings={settings}
            onViewInvoiceModal={(invoice) => setActiveInvoiceModal(invoice)}
          />
        </section>
      </main>

      {/* MODALS */}

      {/* 1. Payment Modal */}
      {paymentData && (
        <PaymentModal
          mode={paymentData.mode}
          billing={paymentData.billing}
          settings={settings}
          activeCustomer={activeCustomer}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentData(null)}
        />
      )}

      {/* 2. Thermal Receipt Roll-out Modal (With Side-by-Side Dual Checkout Buttons) */}
      {receiptData && (
        <ThermalReceiptModal
          transaction={receiptData.transaction}
          cart={receiptData.cart}
          activeCustomer={activeCustomer}
          settings={settings}
          onClose={() => {
            setReceiptData(null);
            syncService.publish({
              paymentStatus: 'IDLE',
              itemsCount: 0,
              totalPayable: 0,
              subtotal: 0,
              discount: 0
            });
          }}
        />
      )}

      {/* 3. Detailed Invoice Modal */}
      {activeInvoiceModal && (
        <InvoiceModal
          invoice={activeInvoiceModal}
          onClose={() => setActiveInvoiceModal(null)}
        />
      )}

      {/* 4. Hardware Settings Modal (Directly opens hardware tabs: Camera & Printer) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 5. Bulk CSV / Excel / PDF Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportSuccess={async () => {
          const fresh = await dataService.getCatalog();
          setCatalog(fresh);
        }}
      />

      {/* 6. Recent 5 Bills Re-Print / WhatsApp Helper Drawer */}
      <RecentBillsDrawer
        isOpen={isRecentBillsOpen}
        onClose={() => setIsRecentBillsOpen(false)}
        salesHistory={salesHistory}
        settings={settings}
        onReprint={(sale) => {
          setReceiptData({
            transaction: sale,
            cart: sale.items || []
          });
        }}
      />

      {/* 7. Add New Product Modal */}
      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* 7. Register New Customer Modal (Starts at Rank 1) */}
      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        initialData={newCustomerInitialData}
        onClose={() => {
          setIsNewCustomerOpen(false);
          setNewCustomerInitialData(null);
        }}
        onAddCustomer={handleAddCustomer}
      />
    </div>
  );
}
