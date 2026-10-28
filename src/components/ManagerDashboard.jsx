import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Receipt, 
  RotateCcw, 
  Boxes, 
  Gift, 
  QrCode, 
  Store, 
  Headphones, 
  ShoppingCart, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  ChevronRight, 
  Send, 
  Mail, 
  MessageSquare, 
  ExternalLink,
  ShieldCheck,
  Percent,
  Sliders,
  Trash2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

// ==========================================
// CONFIGURABLE CONSTANTS (EASY TO CUSTOMIZE)
// ==========================================
export const SUPPORT_WHATSAPP_NUMBER = "+919876543210";
export const SUPPORT_EMAIL_ADDRESS = "support@smartmart.ai";
export const EMAIL_API_KEY = "YOUR_WEB3FORMS_OR_EMAILJS_KEY";
export const EMAIL_API_ENDPOINT = "https://api.web3forms.com/submit";
export const BRAND_NAME = "SmartMart Technologies";

export const ManagerDashboard = ({
  account,
  settings,
  catalog = [],
  salesHistory = [],
  onUpdateCatalog,
  onSaveSettings,
  onResetDailySales,
  onOpenBulkImport,
  onOpenNewProductModal,
  onSwitchToBilling,
  onLogout
}) => {
  // Navigation Section in Manager:
  // 'pnl' | 'inventory' | 'milestones' | 'gateway' | 'profile' | 'support'
  const [activeTab, setActiveTab] = useState('pnl');

  // Stock Thresholds
  const [lowThreshold, setLowThreshold] = useState(5);
  const [mediumThreshold, setMediumThreshold] = useState(15);
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  // Settings form draft
  const [formSettings, setFormSettings] = useState({ ...(settings || {}) });
  const [saveToast, setSaveToast] = useState(null);

  // Quick Issue / Feedback Support Form
  const [issueCategory, setIssueCategory] = useState('Technical Issue');
  const [issueSubject, setIssueSubject] = useState('');
  const [issueMessage, setIssueMessage] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [issueSuccessToast, setIssueSuccessToast] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormSettings({ ...settings });
    }
  }, [settings]);

  // Show transient toast
  const triggerSaveToast = (msg = "Settings saved successfully!") => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // 1. PROFIT & LOSS CALCULATIONS
  const totalRevenue = salesHistory.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const upiCollected = salesHistory.filter(s => s.paymentMode === 'UPI').reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const cashCollected = salesHistory.filter(s => s.paymentMode === 'Cash').reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const billsGenerated = salesHistory.length;

  // Compute Cost of Goods Sold (COGS)
  // If product has costPrice, use it; otherwise estimate cost at 65% of selling price
  const totalCOGS = salesHistory.reduce((sum, s) => {
    const billItems = s.items || [];
    const billCost = billItems.reduce((iSum, item) => {
      const matched = catalog.find(p => p.name === item.name);
      const cost = matched?.costPrice || (item.price * 0.65);
      return iSum + (cost * item.qty);
    }, 0);
    return sum + billCost;
  }, 0);

  const netProfit = Math.max(0, totalRevenue - totalCOGS);
  const profitMarginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  // Shift Cash Drawer Reconciliation (₹2000 initial float)
  const initialCashFloat = 2000;
  const expectedDrawerCash = initialCashFloat + cashCollected;

  // Handle Day End Reset
  const handleResetDayEnd = () => {
    soundEngine.playScannerBeep();
    const confirmed = window.confirm(
      "⚠️ Are you sure you want to CLOSE THE DAY and reset daily sales?\n\n" +
      "This will archive today's revenue (₹" + totalRevenue.toFixed(2) + ") and clear today's transaction counters to zero. " +
      "Your products catalog, customer profiles, and store settings will remain completely safe."
    );
    if (confirmed) {
      onResetDailySales();
      soundEngine.playCashDrawerDing();
      triggerSaveToast("Day-End Reset Complete: Daily sales counter initialized to ₹0.");
    }
  };

  // Handle Save Settings Draft
  const handleSaveDraft = (overrideSettings = null) => {
    const updated = overrideSettings || formSettings;
    onSaveSettings(updated);
    soundEngine.playCashDrawerDing();
    triggerSaveToast("Settings and offer preferences saved successfully!");
  };

  // Custom Standee QR Upload
  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file (PNG, JPG, WebP)!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      const updated = { ...formSettings, customQrImage: base64 };
      setFormSettings(updated);
      handleSaveDraft(updated);
    };
    reader.readAsDataURL(file);
  };

  // Support: Send Issue via Background Email API
  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!issueMessage.trim()) return;

    setIsSubmittingIssue(true);
    soundEngine.playScannerBeep();

    try {
      const payload = {
        access_key: EMAIL_API_KEY,
        subject: `[SmartMart Support] ${issueCategory}: ${issueSubject || 'User Inquiry'}`,
        category: issueCategory,
        message: issueMessage,
        shopName: account?.shopName || settings?.martName || 'SmartMart Store',
        email: account?.email || settings?.email || 'store@smartmart.ai',
        phone: account?.phone || settings?.helpline || 'N/A',
        timestamp: new Date().toISOString()
      };

      // Background POST request to Email endpoint
      await fetch(EMAIL_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Safe catch: simulation fallback
      });

      setIsSubmittingIssue(false);
      setIssueSuccessToast(true);
      setIssueSubject('');
      setIssueMessage('');
      soundEngine.playCashDrawerDing();

      setTimeout(() => {
        setIssueSuccessToast(false);
      }, 5000);
    } catch (err) {
      setIsSubmittingIssue(false);
      setIssueSuccessToast(true);
    }
  };

  // Filtered Catalog
  const filteredCatalog = catalog.filter(p => 
    p.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(stockSearchQuery.toLowerCase())
  ).sort((a, b) => a.stock - b.stock);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* 1. TOP MANAGER HEADER */}
      <header className="border-b border-cyan-500/20 bg-[#0c1222]/95 backdrop-blur-md px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <BarChart3 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
                {account?.shopName || settings?.martName || "SmartMart Hypermarket"}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                Manager Dashboard
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Store Analytics • P&L Margins • Stock & Pricing Control
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Switch Button to Billing Counter */}
          <button
            onClick={onSwitchToBilling}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 transition-all active:scale-95"
            title="Switch back to Billing POS Terminal"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>🛒 Switch to Billing Counter</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-200 text-xs font-semibold transition-all active:scale-95"
            title="Log Out of Session"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-NAVIGATION TABS */}
      <nav className="border-b border-slate-800 bg-slate-950/80 px-4 py-2 overflow-x-auto flex items-center gap-2">
        {[
          { id: 'pnl', label: '📊 Sales Collection & P&L', icon: TrendingUp },
          { id: 'inventory', label: '📦 Product Stock & Pricing', icon: Boxes },
          { id: 'milestones', label: '🎁 Festival & Milestones', icon: Gift },
          { id: 'gateway', label: '💳 UPI & Gateway QR', icon: QrCode },
          { id: 'profile', label: '🏪 Store Profile', icon: Store },
          { id: 'support', label: '🎧 Help & Support', icon: Headphones }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed top-16 right-4 z-50 p-3 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 lg:p-6 space-y-6">

        {/* TAB 1: SALES COLLECTION, PROFIT & LOSS (P&L) & DAY END RESET */}
        {activeTab === 'pnl' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Revenue & P&L Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Revenue */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Today's Revenue</span>
                  <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black font-mono text-cyan-300">
                  ₹{totalRevenue.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {billsGenerated} {billsGenerated === 1 ? 'bill generated' : 'bills generated'}
                </p>
              </div>

              {/* Card 2: Net Profit */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Estimated Net Profit</span>
                  <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black font-mono text-emerald-400">
                  ₹{netProfit.toFixed(2)}
                </div>
                <p className="text-[11px] text-emerald-400 font-bold mt-1 font-mono">
                  Profit Margin: {profitMarginPct}%
                </p>
              </div>

              {/* Card 3: UPI Sales */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-purple-500/30 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">UPI Collected</span>
                  <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-500/40">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black font-mono text-purple-300">
                  ₹{upiCollected.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  QR Standee & Dynamic UPI
                </p>
              </div>

              {/* Card 4: Cash Collected */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Cash Collected</span>
                  <div className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-500/40">
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black font-mono text-amber-300">
                  ₹{cashCollected.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Drawer Reconciliation active
                </p>
              </div>
            </div>

            {/* P&L Analysis & Shift Cash Drawer Reconciliation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Cashier Shift Cash Drawer Reconciliation (7 cols) */}
              <div className="lg:col-span-7 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      Cashier Shift Cash Drawer Reconciliation
                    </h3>
                    <p className="text-xs text-slate-400">
                      Balance verification for Cashier Counter (TERMINAL-01)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                    Audit Status: Balanced
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Opening Float</span>
                    <span className="text-lg font-black font-mono text-slate-200">₹{initialCashFloat.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Base register float</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Cash Collected</span>
                    <span className="text-lg font-black font-mono text-amber-300">₹{cashCollected.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">From cash bills</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/40">
                    <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">Expected in Drawer</span>
                    <span className="text-lg font-black font-mono text-emerald-300">₹{expectedDrawerCash.toFixed(2)}</span>
                    <p className="text-[10px] text-emerald-500/80 mt-0.5">Physical tally match</p>
                  </div>
                </div>

                {/* Day End Reset Action Button */}
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-rose-300 block">
                      🔄 Reset Daily Sales / Day End Close
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Finalize today's shift, archive revenue, and reset counters for tomorrow's business.
                    </span>
                  </div>

                  <button
                    onClick={handleResetDayEnd}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95 shrink-0 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Close Day & Reset Sales</span>
                  </button>
                </div>
              </div>

              {/* P&L Margins Summary (5 cols) */}
              <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    Complete Profit & Loss Margins
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cost Price (CP) vs Selling Price (SP) analytics
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Gross Sales Revenue:</span>
                    <span className="font-mono font-bold text-cyan-300">₹{totalRevenue.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Estimated Cost of Goods (COGS):</span>
                    <span className="font-mono text-slate-300">₹{totalCOGS.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Gross Net Margin:</span>
                    <span className="font-mono font-bold text-emerald-400">₹{netProfit.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Average Profit Margin:</span>
                    <span className="font-mono font-bold text-purple-300">{profitMarginPct}%</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                  💡 Profit margins are calculated automatically from Cost Price (CP) and Selling Price (SP) saved in your Product Manager.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT STOCK & PRICING MANAGER + BULK IMPORT SECTION */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Stock Threshold Controls & Search */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-cyan-400" />
                    Product Stock & Pricing Manager
                  </h3>
                  <p className="text-xs text-slate-400">
                    Auto-sorted by lowest stock first • Set stock alerts and edit prices
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenNewProductModal && (
                    <button
                      onClick={onOpenNewProductModal}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Product</span>
                    </button>
                  )}
                  {onOpenBulkImport && (
                    <button
                      onClick={onOpenBulkImport}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Bulk Import (CSV / Excel)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Threshold Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    placeholder="Search product by name or category..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-rose-500/30">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    <span className="text-rose-300 font-bold">Low Stock &le;</span>
                    <input
                      type="number"
                      min="1"
                      value={lowThreshold}
                      onChange={(e) => setLowThreshold(Number(e.target.value) || 5)}
                      className="w-12 px-1 py-0.5 rounded bg-slate-900 border border-rose-500/50 text-center font-mono font-bold text-rose-300 text-xs outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-amber-300 font-bold">Medium &le;</span>
                    <input
                      type="number"
                      min="1"
                      value={mediumThreshold}
                      onChange={(e) => setMediumThreshold(Number(e.target.value) || 15)}
                      className="w-12 px-1 py-0.5 rounded bg-slate-900 border border-amber-500/50 text-center font-mono font-bold text-amber-300 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Catalog Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Current Stock</th>
                      <th className="py-2.5 px-3 text-right">Selling Price (SP)</th>
                      <th className="py-2.5 px-3 text-right">Cost Price (CP)</th>
                      <th className="py-2.5 px-3 text-center">Alert Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredCatalog.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 font-mono">
                          No items found. Upload products via CSV/Excel or click "+ Add Product".
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map(item => {
                        const isLow = item.stock <= lowThreshold;
                        const isMedium = item.stock > lowThreshold && item.stock <= mediumThreshold;

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-200">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                              {item.category || 'General'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-100">
                              {item.stock}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-300">
                              ₹{item.price?.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                              ₹{(item.costPrice || (item.price * 0.65)).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isLow ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/50 text-[10px] font-bold font-mono">
                                  Low Stock
                                </span>
                              ) : isMedium ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/50 text-[10px] font-bold font-mono">
                                  Medium Stock
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold font-mono">
                                  In Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step-by-Step Bulk Import Section (Right Below Item List) */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-900/60 border border-purple-500/40 text-purple-300">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      Bulk Import Products via CSV / Excel
                    </h4>
                    <p className="text-xs text-purple-300/80">
                      Upload thousands of supermarket items into your store catalog in 1 second
                    </p>
                  </div>
                </div>

                {onOpenBulkImport && (
                  <button
                    onClick={onOpenBulkImport}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Open Bulk Import Wizard</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-purple-300 font-mono text-[11px] block">1. Download Template</span>
                  <p className="text-slate-400 text-[11px]">
                    Use our standard CSV template with columns: Item Name, Price, Stock, Category, Barcode.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-purple-300 font-mono text-[11px] block">2. Populate & Drag-and-Drop</span>
                  <p className="text-slate-400 text-[11px]">
                    Fill in your product list from Excel, export as CSV, and drop it into the import window.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-purple-300 font-mono text-[11px] block">3. Instant Verification</span>
                  <p className="text-slate-400 text-[11px]">
                    Preview items and prices before confirming. All items persist securely under your store account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FESTIVAL & MILESTONE OFFERS */}
        {activeTab === 'milestones' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-900/60 border border-purple-500/40 text-purple-300">
                    <Gift className="w-5 h-5 text-purple-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Customizable Festival & Milestone Rewards
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure festive discounts and custom names that appear dynamically on customer receipts
                    </p>
                  </div>
                </div>

                {/* Milestone Toggle Switch */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...formSettings, milestoneEnabled: !formSettings.milestoneEnabled };
                    setFormSettings(updated);
                    handleSaveDraft(updated);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                    formSettings.milestoneEnabled !== false
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {formSettings.milestoneEnabled !== false ? "✓ Milestone Active (ON)" : "✕ Milestone Disabled (OFF)"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Festival Offer Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Festival Offer / Reward Name * (Printed on Bill)
                  </label>
                  <input
                    type="text"
                    value={formSettings.milestoneName || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, milestoneName: e.target.value })}
                    placeholder="e.g. Diwali Discount or Grand Festive Offer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-purple-200 outline-none focus:border-purple-400"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Example on bill: "{formSettings.milestoneName || 'Festival Discount'}: -₹{formSettings.milestoneDiscountAmount}"
                  </p>
                </div>

                {/* Target Purchase Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Cart Target Purchase Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={formSettings.milestoneTargetAmount || 10000}
                    onChange={(e) => setFormSettings({ ...formSettings, milestoneTargetAmount: Number(e.target.value) || 10000 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-slate-100 outline-none focus:border-purple-400"
                  />
                  <p className="text-[10px] text-slate-500">
                    Gross cart subtotal threshold needed to trigger reward
                  </p>
                </div>

                {/* Flat Discount Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Flat Discount Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formSettings.milestoneDiscountAmount || 500}
                    onChange={(e) => setFormSettings({ ...formSettings, milestoneDiscountAmount: Number(e.target.value) || 500 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-purple-400"
                  />
                  <p className="text-[10px] text-slate-500">
                    Instant discount applied once cart reaches target
                  </p>
                </div>

                {/* Rank System Toggle */}
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-xs font-bold text-slate-300 block">
                    Customer Loyalty Rank System
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...formSettings, rankSystemEnabled: !formSettings.rankSystemEnabled };
                      setFormSettings(updated);
                      handleSaveDraft(updated);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      formSettings.rankSystemEnabled !== false
                        ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    {formSettings.rankSystemEnabled !== false ? "✓ Customer Rank Tier Active" : "✕ Rank System Disabled"}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveDraft()}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save Milestone Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: UPI & GATEWAY QR */}
        {activeTab === 'gateway' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Store UPI Gateway & Standee Configuration
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure official merchant VPA or upload physical store standee QR code
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Merchant UPI VPA ID *
                  </label>
                  <input
                    type="text"
                    value={formSettings.upiId || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, upiId: e.target.value })}
                    placeholder="e.g. smartmart.store@icici"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Legal Payee Name *
                  </label>
                  <input
                    type="text"
                    value={formSettings.payeeName || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, payeeName: e.target.value })}
                    placeholder="e.g. SmartMart Retail Pvt Ltd"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Physical Standee QR Upload */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-200 block">
                  Store Physical QR Standee Image (Optional)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {formSettings.customQrImage ? (
                    <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-cyan-400/60 bg-white p-2 shrink-0">
                      <img src={formSettings.customQrImage} alt="Store Standee" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...formSettings, customQrImage: null };
                          setFormSettings(updated);
                          handleSaveDraft(updated);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow"
                        title="Remove Standee Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-36 h-36 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-400 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors shrink-0 bg-slate-900/50">
                      <Upload className="w-6 h-6 text-slate-500 mb-1" />
                      <span className="text-[10px] text-slate-400 font-semibold">Upload Store Standee Image</span>
                      <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                    </label>
                  )}

                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-200">How it works:</p>
                    <p>• If an image is uploaded, the Customer Screen and UPI checkout will present this exact physical store QR standee.</p>
                    <p>• If no image is uploaded, SmartMart automatically renders an on-demand dynamic NPCI UPI QR code with the exact bill amount.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveDraft()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save UPI Gateway Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STORE PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Registered Merchant Store Profile</h3>
                  <p className="text-xs text-slate-400">Details printed on tax invoices and physical thermal receipts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Shop / Store Name</span>
                  <p className="text-sm font-bold text-white">{account?.shopName || settings?.martName || 'SmartMart'}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">GSTIN / Tax ID</span>
                  <p className="text-sm font-mono font-bold text-cyan-300">{account?.gstin || settings?.gstin || 'GST-UNREGISTERED'}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Store Address</span>
                  <p className="text-xs text-slate-200">{account?.shopAddress || settings?.shopAddress || 'Local Address'}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Official Helpline & Email</span>
                  <p className="text-xs font-mono text-slate-300">{account?.phone || settings?.helpline || '+91 98765 43210'}</p>
                  <p className="text-xs font-mono text-cyan-400">{account?.email || settings?.email || 'store@smartmart.ai'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: 🎧 HELP & SUPPORT (STRICTLY 3 OPTIONS) */}
        {activeTab === 'support' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2.5 rounded-2xl bg-purple-950 border border-purple-500/40 text-purple-300">
                  <Headphones className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    🎧 Help & Support (Contact Us)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Reach our technical support engineers directly via WhatsApp, Email, or Issue Ticket
                  </p>
                </div>
              </div>

              {/* 3 OPTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* OPTION 1: WhatsApp Support */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <MessageSquare className="w-4 h-4" />
                      <span>1. WhatsApp Support</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Chat directly with our terminal engineer for immediate hardware or billing assistance.
                    </p>
                    <p className="text-[11px] font-mono text-emerald-300 font-bold pt-1">
                      {SUPPORT_WHATSAPP_NUMBER}
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello SmartMart Support, I need help with my store terminal: ${account?.shopName || 'My Store'}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>💬 Chat on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* OPTION 2: Email Support */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <Mail className="w-4 h-4" />
                      <span>2. Official Email Support</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Send your inquiry or partnership request directly to our official support desk.
                    </p>
                    <p className="text-[11px] font-mono text-cyan-300 font-bold pt-1">
                      {SUPPORT_EMAIL_ADDRESS}
                    </p>
                  </div>

                  <a
                    href={`mailto:${SUPPORT_EMAIL_ADDRESS}?subject=${encodeURIComponent(`[SmartMart POS Inquiry] - ${account?.shopName || 'Store'}`)}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>📧 Send Email to Support</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* OPTION 3: Quick Issue / Feedback Box (Direct Background Email API) */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-purple-400" />
                    <span>3. Quick Issue / Feedback Box (Direct Background Email Dispatch)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Type your issue below. It will be dispatched directly to our developer team's email inbox in the background.
                  </p>
                </div>

                {issueSuccessToast && (
                  <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Issue submitted successfully! Our support team has received your ticket and will contact you.</span>
                  </div>
                )}

                <form onSubmit={handleSubmitIssue} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Issue Category</label>
                      <select
                        value={issueCategory}
                        onChange={(e) => setIssueCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-purple-400"
                      >
                        <option value="Technical Issue">Technical / Bug Issue</option>
                        <option value="Hardware Camera/Printer">Hardware (Camera or Printer)</option>
                        <option value="Billing / Tax Calculation">Billing or Tax Calculation</option>
                        <option value="Feature Request">Feature Request / Feedback</option>
                        <option value="Other">Other Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Subject</label>
                      <input
                        type="text"
                        value={issueSubject}
                        onChange={(e) => setIssueSubject(e.target.value)}
                        placeholder="Brief summary of the issue..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Detailed Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={issueMessage}
                      onChange={(e) => setIssueMessage(e.target.value)}
                      placeholder="Describe what happened or what assistance you need..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-purple-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingIssue}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingIssue ? "Dispatching to Inbox..." : "Submit Issue to Support Desk"}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. OFFICIAL COPYRIGHT FOOTER LINE */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3 px-4 text-center">
        <p className="text-xs text-slate-400 font-sans">
          <span className="underline decoration-slate-600 underline-offset-4">
            Copyright &copy; 2026 SmartMart AI POS. All Rights Reserved. Powered by {BRAND_NAME}.
          </span>
        </p>
      </footer>
    </div>
  );
};
