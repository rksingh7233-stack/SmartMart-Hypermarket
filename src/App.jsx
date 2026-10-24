import React, { useState, useEffect } from 'react';
import { 
  initStorage, 
  getCatalog, 
  saveCatalog,
  getCustomers, 
  saveCustomers,
  addCustomer,
  getSettings, 
  saveSettings,
  getSalesHistory, 
  recordSale,
  updateCustomerHistory,
  updateProductStock
} from './services/storage';
import { soundEngine } from './services/audioService';
import { syncService } from './services/syncService';

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

  // Master state
  const [catalog, setCatalog] = useState([]);
  const [customers, setCustomers] = useState([]); // Starts EMPTY []
  const [settings, setSettings] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);

  // Active terminal state
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [extraDiscount, setExtraDiscount] = useState(0);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomerInitialData, setNewCustomerInitialData] = useState(null);
  const [activeInvoiceModal, setActiveInvoiceModal] = useState(null);
  const [paymentData, setPaymentData] = useState(null); // { mode, billing }
  const [receiptData, setReceiptData] = useState(null); // { transaction, cart }

  // Detect URL Route changes (e.g., #/customer or /customer)
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

  // Initial load
  useEffect(() => {
    initStorage();
    const loadedCatalog = getCatalog();
    const loadedCustomers = getCustomers(); // Starts EMPTY []
    const loadedSettings = getSettings();
    const loadedSales = getSalesHistory();

    setCatalog(loadedCatalog);
    setCustomers(loadedCustomers);
    setSettings(loadedSettings);
    setSalesHistory(loadedSales);

    // If there are any registered customers, select the first one, otherwise null
    if (loadedCustomers.length > 0) {
      setActiveCustomer(loadedCustomers[0]);
    } else {
      setActiveCustomer(null);
    }
  }, []);

  // 1. DUAL SYNCHRONIZATION: Broadcast POS state to Customer Display Screen in real-time
  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let rankDiscountPct = 0;
    if (activeCustomer && settings?.discountSlabs) {
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
    const milestoneDiscountAmount = subtotal >= milestoneTarget ? milestoneDiscount : 0;

    const extraDiscountAmount = extraDiscount || 0;
    const totalDiscount = rankDiscountAmount + milestoneDiscountAmount + extraDiscountAmount;
    const totalPayable = Math.max(0, subtotal - totalDiscount);

    // Determine current payment state for customer screen
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

    // Publish to BroadcastChannel & localStorage
    syncService.publish({
      customerName: activeCustomer?.name || null,
      customerId: activeCustomer?.id || null,
      customerAvatar: activeCustomer?.avatar || null,
      customerRank: activeCustomer?.rank || null,
      customerTier: activeCustomer?.tier || null,
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
        ? `Welcome to SmartMart, ${customer.salutation || customer.name}! Enjoy your first visit perks and exclusive member discounts today.`
        : `Welcome back, ${customer.salutation || customer.name}! Today is your ${customer.visits}th visit to our mall.`;
      
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
        alert(`Cannot add more ${product.name}. Available stock limit reached (${product.stock} units).`);
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
  const handlePaymentSuccess = (transactionResult) => {
    // 1. Deduct stock from catalog
    let updatedCatalog = [...catalog];
    cart.forEach(cartItem => {
      updatedCatalog = updateProductStock(cartItem.id, -cartItem.quantity);
    });
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
    const updatedSales = recordSale(saleRecord);
    setSalesHistory(updatedSales);

    // 3. Update customer history & spend if active customer
    if (activeCustomer) {
      const updatedCustomers = updateCustomerHistory(activeCustomer.id, {
        id: saleRecord.id,
        invoiceNo: saleRecord.invoiceNo,
        date: saleRecord.date,
        items: saleRecord.items,
        subtotal: saleRecord.subtotal,
        rankDiscountPct: activeCustomer.rank <= 5 ? 20 : (activeCustomer.rank <= 15 ? 15 : 10),
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

    // 5. Close payment modal and launch Thermal Receipt Roll-out!
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
  const handleAddProduct = (newProduct) => {
    const updated = [newProduct, ...catalog];
    setCatalog(updated);
    saveCatalog(updated);
  };

  // Add Customer (Real face descriptor & photo snapshot)
  const handleAddCustomer = (newCustomer) => {
    const updated = addCustomer(newCustomer);
    setCustomers(updated);
    setActiveCustomer(newCustomer);
  };

  // Update Settings
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Reset Daily Sales / Day End
  const handleResetDailySales = (updatedSettings) => {
    setSalesHistory([]);
    if (updatedSettings) {
      setSettings(updatedSettings);
    }
  };

  // RENDER CUSTOMER DISPLAY SCREEN IF ON /customer OR #/customer
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

  // RENDER CASHIER POS TERMINAL
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
      {/* Top Header Navigation */}
      <Header 
        settings={settings}
        activeCustomer={activeCustomer}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCustomerDisplay={() => {
          window.location.hash = '#/customer';
          setCurrentRoute('customer');
        }}
      />

      {/* Main Two-Column Layout */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: POS Operations & Cart (7 of 12 columns) */}
        <section className="lg:col-span-7 flex flex-col space-y-4">
          {/* Search / Barcode Bar & Category Pills */}
          <BarcodeScannerBar
            catalog={catalog}
            onAddToCart={handleAddToCart}
            onOpenNewProductModal={() => setIsNewProductOpen(true)}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Current Cart Items Table with Inline Price Edit & Quick Catalog */}
          <CartTable
            cart={cart}
            catalog={catalog}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdatePrice={handleUpdatePrice}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onAddToCart={handleAddToCart}
            selectedCategory={selectedCategory}
          />

          {/* Dynamic Smart AI Cross-Sell / Habit Prompts Banner */}
          <AICrossSellBanner
            cart={cart}
            activeCustomer={activeCustomer}
            catalog={catalog}
            onAddToCart={handleAddToCart}
          />

          {/* Billing Subtotal, Rank Discount Breakdown & 3 Payment Action Buttons */}
          <BillingSummary
            cart={cart}
            activeCustomer={activeCustomer}
            settings={settings}
            extraDiscount={extraDiscount}
            onUpdateExtraDiscount={setExtraDiscount}
            onInitiatePayment={handleInitiatePayment}
          />
        </section>

        {/* Right Column: AI Real Multi-Face Detection & Customer Profile (5 of 12 columns) */}
        <section className="lg:col-span-5 flex flex-col space-y-4">
          {/* Real Live AI Multi-Face Camera Feed with Overlay Canvas (0 faces = 0 boxes) */}
          <MultiFaceCamera
            customers={customers}
            activeCustomer={activeCustomer}
            onSelectCustomer={(c) => handleSelectCustomer(c, true)}
            onOpenNewCustomerModalWithSnapshot={(data) => {
              setNewCustomerInitialData(data);
              setIsNewCustomerOpen(true);
            }}
            onOpenManualLookup={() => {
              const input = document.querySelector('input[placeholder*="Search Saved ID"]');
              if (input) input.focus();
            }}
          />

          {/* Active Customer Profile Box with Real Captured Snapshot & Voice Greeting Quote */}
          <CustomerProfileBox
            activeCustomer={activeCustomer}
            customers={customers}
            onSelectCustomer={(c) => handleSelectCustomer(c, true)}
          />

          {/* Customer Analytics & History Cards with Past Bill 3-Dots Invoice Trigger */}
          <CustomerAnalytics
            activeCustomer={activeCustomer}
            cart={cart}
            settings={settings}
            onViewInvoiceModal={(invoice) => setActiveInvoiceModal(invoice)}
          />
        </section>
      </main>

      {/* MODALS */}

      {/* 1. Payment Modal (Pay Cash, Pay Online UPI, Split Cash+UPI) */}
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

      {/* 2. Thermal Receipt Roll-out Modal with Print & Back to POS Button */}
      {receiptData && (
        <ThermalReceiptModal
          transaction={receiptData.transaction}
          cart={receiptData.cart}
          activeCustomer={activeCustomer}
          settings={settings}
          onClose={() => {
            setReceiptData(null);
            // Reset sync to idle
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

      {/* 3. Detailed Past Bill Invoice Modal with Back to POS Button */}
      {activeInvoiceModal && (
        <InvoiceModal
          invoice={activeInvoiceModal}
          onClose={() => setActiveInvoiceModal(null)}
        />
      )}

      {/* 4. PIN-Protected Settings & POS Control Panel */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        catalog={catalog}
        salesHistory={salesHistory}
        onSaveSettings={handleSaveSettings}
        onUpdateCatalog={(newCatalog) => {
          setCatalog(newCatalog);
          saveCatalog(newCatalog);
        }}
        onResetDailySales={handleResetDailySales}
        onClose={() => setIsSettingsOpen(false)}
        onViewInvoiceModal={(invoice) => setActiveInvoiceModal(invoice)}
      />

      {/* 5. Add New Product Modal */}
      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* 6. Register New Customer with Live Captured Face Snapshot */}
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
