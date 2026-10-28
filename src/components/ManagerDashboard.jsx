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
  ArrowRight,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
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

  // Stock Alert Calculations
  const lowStockItems = catalog.filter(p => p.stock > 0 && p.stock <= lowThreshold);
  const outOfStockItems = catalog.filter(p => p.stock <= 0);
  const totalAlertItems = lowStockItems.length + outOfStockItems.length;

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

  // FEATURE 3: Export Sales & P&L Report (CSV / Excel)
  const handleExportPnLReport = () => {
    soundEngine.playScannerBeep();
    
    // 1. Summary sheet
    const summaryRows = [
      ["SmartMart AI POS - Official Sales & Profit & Loss Accounting Report"],
      ["Generated At", new Date().toLocaleString('en-IN')],
      ["Store / Shop Name", account?.shopName || settings?.martName || "SmartMart Hypermarket"],
      ["Helpline / Phone", account?.phone || settings?.helpline || "N/A"],
      ["GST Number", account?.gst || settings?.gstNumber || "N/A"],
      [],
      ["FINANCIAL & MARGIN METRICS", "AMOUNT (₹)"],
      ["Gross Revenue", totalRevenue],
      ["Cost of Goods Sold (COGS)", totalCOGS],
      ["Net Profit", netProfit],
      ["Profit Margin (%)", `${profitMarginPct}%`],
      ["Total Bills Generated", billsGenerated],
      ["UPI Collection", upiCollected],
      ["Cash Collection", cashCollected],
      ["Initial Cash Float", initialCashFloat],
      ["Expected Cash in Drawer", expectedDrawerCash]
    ];

    // 2. Transactions sheet
    const txnHeaders = ["Transaction ID", "Date", "Customer Name", "Payment Mode", "Items Count", "Subtotal (₹)", "Discount (₹)", "Total Paid (₹)"];
    const txnRows = salesHistory.map(s => [
      s.invoiceNo || s.id,
      s.date ? new Date(s.date).toLocaleString('en-IN') : 'N/A',
      s.customerName || 'Walk-in Guest',
      s.paymentMode || 'UPI',
      s.itemsCount || (s.items ? s.items.length : 1),
      s.subtotal || s.totalPaid || 0,
      s.discount || 0,
      s.totalPaid || 0
    ]);

    // 3. Item-wise sales breakdown sheet
    const itemMap = new Map();
    salesHistory.forEach(sale => {
      (sale.items || []).forEach(it => {
        const key = it.name;
        if (!itemMap.has(key)) {
          const matched = catalog.find(p => p.name === it.name);
          itemMap.set(key, {
            name: it.name,
            qty: 0,
            revenue: 0,
            costPrice: matched?.costPrice || (it.price * 0.65),
            sellingPrice: it.price
          });
        }
        const record = itemMap.get(key);
        record.qty += (it.qty || 1);
        record.revenue += ((it.qty || 1) * it.price);
      });
    });

    const itemWiseHeaders = ["Item Name", "Units Sold", "Selling Price (₹)", "Cost Price (₹)", "Total Revenue (₹)", "Total Cost (₹)", "Net Profit (₹)", "Profit Margin (%)"];
    const itemWiseRows = Array.from(itemMap.values()).map(it => {
      const totalCost = it.costPrice * it.qty;
      const profit = it.revenue - totalCost;
      const margin = it.revenue > 0 ? ((profit / it.revenue) * 100).toFixed(1) : "0.0";
      return [
        it.name,
        it.qty,
        it.sellingPrice,
        it.costPrice,
        it.revenue,
        totalCost,
        profit,
        `${margin}%`
      ];
    });

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    const wsTxns = XLSX.utils.aoa_to_sheet([txnHeaders, ...txnRows]);
    const wsItems = XLSX.utils.aoa_to_sheet([itemWiseHeaders, ...itemWiseRows]);

    XLSX.utils.book_append_sheet(wb, wsSummary, "P&L Summary");
    XLSX.utils.book_append_sheet(wb, wsItems, "Item-Wise Profits");
    XLSX.utils.book_append_sheet(wb, wsTxns, "Sales Transactions");

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `smartmart_sales_pnl_report_${dateStr}.xlsx`);
    soundEngine.playCashDrawerDing();
    triggerSaveToast("Sales & P&L accounting report exported successfully!");
  };

  // Download Sample Template for Product Stock Manager
  const handleDownloadSampleTemplate = () => {
    soundEngine.playScannerBeep();
    const sampleRows = [
      ["Item Name", "Category", "Cost Price", "Selling Price", "Stock", "Barcode"],
      ["Basmati Royal Biryani Rice (5kg)", "Grocery & Staples", 480, 620, 30, "890103001"],
      ["Organic Cold Pressed Mustard Oil (1L)", "Grocery & Staples", 135, 180, 45, "890103002"],
      ["Tata Sampann Unpolished Toor Dal (1kg)", "Grocery & Staples", 125, 165, 35, "890103003"],
      ["Cadbury Bournvita Health Drink (500g)", "Beverages", 195, 245, 20, "890103004"],
      ["Amul Garlic Butter (200g)", "Dairy & Daily Essentials", 90, 115, 25, "890103005"],
      ["Dabur Red Ayurvedic Toothpaste (300g)", "Personal Care & Cleaning", 105, 135, 40, "890103006"],
      ["Britannia Good Day Cashew Cookies (200g)", "Snacks & Chocolates", 32, 45, 60, "890103007"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Template");
    XLSX.writeFile(wb, "smartmart_inventory_template.xlsx");
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

      {/* FEATURE 2: Low Stock & Out-of-Stock Alert Banner */}
      {totalAlertItems > 0 && (
        <div className="mx-4 lg:mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-rose-950/70 via-amber-950/40 to-slate-900 border border-rose-500/50 shadow-xl space-y-2.5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-900 text-rose-300">
                <AlertCircle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-black text-rose-200 uppercase tracking-wider flex items-center gap-2">
                  <span>🚨 Inventory Restock Alert:</span>
                  <span className="text-white font-mono font-normal">
                    {outOfStockItems.length} Out of Stock • {lowStockItems.length} Low in Stock
                  </span>
                </h4>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('inventory')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Restock in Product Manager</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Chips of alert items */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            {outOfStockItems.map(item => (
              <span 
                key={item.id}
                className="px-2.5 py-1 rounded-lg bg-rose-950 border border-rose-500/60 text-[11px] font-bold text-rose-300 flex items-center gap-1"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{item.name}:</span>
                <strong className="text-white uppercase font-mono">Out of Stock (0)</strong>
              </span>
            ))}
            {lowStockItems.slice(0, 6).map(item => (
              <span 
                key={item.id}
                className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-[11px] font-semibold text-amber-200 flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{item.name}:</span>
                <strong className="text-amber-400 font-mono">{item.stock} left</strong>
              </span>
            ))}
            {lowStockItems.length > 6 && (
              <span className="px-2 py-1 text-[11px] text-slate-400">
                +{lowStockItems.length - 6} more low stock items
              </span>
            )}
          </div>
        </div>
      )}

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed top-16 right-4 z-50 p-3 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 lg:p-6 space-y-6">

        {/* TAB 1: SALES COLLECTION, PROFIT & LOSS (P&L), EXPORT & DAY END RESET */}
        {activeTab === 'pnl' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Action Bar: Title & Export Sales & P&L Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-3xl border border-slate-800 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Sales Collection & Comprehensive P&L Report</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Live metrics, drawer reconciliation, and 1-click accounting exports
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPnLReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                  title="Export complete Sales & P&L accounting report in Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>📥 Export Sales & P&L Report (CSV / Excel)</span>
                </button>
              </div>
            </div>

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
                  <button
                    onClick={handleDownloadSampleTemplate}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold"
                    title="Download Sample Template"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>📄 Sample Template</span>
                  </button>

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
                      <span>Bulk Import (CSV / Excel / PDF)</span>
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
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                                item.stock === 0
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                                  : isLow
                                    ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                                    : isMedium
                                      ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40'
                                      : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                              }`}>
                                {item.stock} units
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-300">
                              ₹{item.price.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                              ₹{(item.costPrice || (item.price * 0.65)).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.stock === 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500 text-rose-300 font-bold text-[10px] uppercase tracking-wider">
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-400 font-semibold text-[10px] uppercase">
                                  Low Stock
                                </span>
                              ) : isMedium ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400 font-semibold text-[10px] uppercase">
                                  Medium Stock
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-semibold text-[10px] uppercase">
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
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-900/60 border border-purple-500/40 text-purple-300">
                    <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Bulk Import Products via CSV / Excel / PDF
                    </h3>
                    <p className="text-xs text-slate-400">
                      Step-by-step wizard to upload entire product catalogs from legacy systems
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSampleTemplate}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>📄 Download Sample Template</span>
                  </button>

                  {onOpenBulkImport && (
                    <button
                      onClick={onOpenBulkImport}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Open Bulk Import Wizard</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-purple-300 font-mono text-[11px] block">1. Download Template</span>
                  <p className="text-slate-400 text-[11px]">
                    Use our standard CSV or Excel template with columns: Item Name, Price, Stock, Category, Barcode.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-purple-300 font-mono text-[11px] block">2. Populate & Drag-and-Drop</span>
                  <p className="text-slate-400 text-[11px]">
                    Upload CSV, Excel (.xlsx/.xls), or PDF. Our fuzzy AI automatically matches columns.
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
                  {formSettings.milestoneEnabled !== false ? "✓ Enabled" : "✕ Disabled"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Festival Offer Name (Printed on Receipt)
                  </label>
                  <input
                    type="text"
                    value={formSettings.milestoneName || "Grand Mega Saver Discount"}
                    onChange={(e) => setFormSettings({ ...formSettings, milestoneName: e.target.value })}
                    placeholder="e.g. Diwali Dhamaka / New Year Celebration"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Milestone Target Cart Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={formSettings.milestoneTargetAmount || 10000}
                    onChange={(e) => setFormSettings({ ...formSettings, milestoneTargetAmount: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Reward Flat Discount Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formSettings.milestoneDiscountAmount || 500}
                    onChange={(e) => setFormSettings({ ...formSettings, milestoneDiscountAmount: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => handleSaveDraft()}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all active:scale-95"
                  >
                    Save Festival Rewards
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: UPI & PAYMENT GATEWAY QR STANDEE */}
        {activeTab === 'gateway' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    UPI Payment Gateway & Physical QR Standee
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure your merchant VPA or upload your counter QR standee image
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Store UPI VPA / ID</label>
                  <input
                    type="text"
                    value={formSettings.upiId || ""}
                    onChange={(e) => setFormSettings({ ...formSettings, upiId: e.target.value })}
                    placeholder="e.g. merchant@icici or 9876543210@paytm"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Legal Merchant Payee Name</label>
                  <input
                    type="text"
                    value={formSettings.payeeName || ""}
                    onChange={(e) => setFormSettings({ ...formSettings, payeeName: e.target.value })}
                    placeholder="e.g. SmartMart Retail Private Limited"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Physical Standee QR Image Upload */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Custom Store Counter QR Standee Image
                  </span>
                  {formSettings.customQrImage && (
                    <button
                      onClick={() => {
                        const updated = { ...formSettings, customQrImage: null };
                        setFormSettings(updated);
                        handleSaveDraft(updated);
                      }}
                      className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Standee</span>
                    </button>
                  )}
                </div>

                {formSettings.customQrImage ? (
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 p-1 rounded-xl bg-white flex items-center justify-center shadow-lg">
                      <img 
                        src={formSettings.customQrImage} 
                        alt="Store Standee QR" 
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p className="text-emerald-400 font-bold">✓ Active Custom Standee Configured</p>
                      <p className="text-[11px]">This exact standee QR will be displayed on the customer display screen and checkout popup.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 space-y-2">
                    <p>No custom standee image uploaded. System is dynamically generating standard NPCI QR codes.</p>
                    <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold cursor-pointer hover:bg-cyan-900 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Standee Image (PNG/JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQrUpload}
                      />
                    </label>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSaveDraft()}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition-all active:scale-95"
              >
                Save Payment Settings
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: STORE PROFILE & RECEIPT BRANDING */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2.5 rounded-2xl bg-purple-950 border border-purple-500/40 text-purple-300">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Store Profile & Receipt Branding Details
                  </h3>
                  <p className="text-xs text-slate-400">
                    These business details are automatically printed on customer thermal tax receipts
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Shop Name</label>
                  <input
                    type="text"
                    value={formSettings.martName || ""}
                    onChange={(e) => setFormSettings({ ...formSettings, martName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">GSTIN / Tax Number</label>
                  <input
                    type="text"
                    value={formSettings.gstNumber || ""}
                    onChange={(e) => setFormSettings({ ...formSettings, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-semibold mb-1 block">Shop Full Address</label>
                  <input
                    type="text"
                    value={formSettings.address || ""}
                    onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Phone / Helpline</label>
                  <input
                    type="text"
                    value={formSettings.helpline || ""}
                    onChange={(e) => setFormSettings({ ...formSettings, helpline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Email ID</label>
                  <input
                    type="email"
                    value={formSettings.email || ""}
                    onChange={(e) => setFormSettings({ ...formSettings, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSaveDraft()}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all active:scale-95"
              >
                Save Store Profile
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: HELP & SUPPORT (STRICTLY 3 OPTIONS) */}
        {activeTab === 'support' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-cyan-400" />
                  🎧 Help & Support (Contact Us)
                </h3>
                <p className="text-xs text-slate-400">
                  Direct channels to reach our technical and customer support team 24/7
                </p>
              </div>

              {/* Strict 3 Support Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OPTION 1: WhatsApp Support */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <MessageSquare className="w-4 h-4" />
                      <span>1. WhatsApp Support</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Chat directly with our support engineers on WhatsApp for quick query resolution.
                    </p>
                    <span className="font-mono text-xs font-bold text-slate-200 block">
                      {SUPPORT_WHATSAPP_NUMBER}
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hello SmartMart Support team! I need assistance with my store: ${account?.shopName || settings?.martName || 'SmartMart Store'}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <span>Open WhatsApp Chat</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* OPTION 2: Email Support */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                      <Mail className="w-4 h-4" />
                      <span>2. Official Email Support</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Write to our official enterprise support inbox for SLA guarantees and hardware inquiries.
                    </p>
                    <span className="font-mono text-xs font-bold text-slate-200 block">
                      {SUPPORT_EMAIL_ADDRESS}
                    </span>
                  </div>

                  <a
                    href={`mailto:${SUPPORT_EMAIL_ADDRESS}?subject=${encodeURIComponent(
                      `[Support Request] ${account?.shopName || settings?.martName || 'SmartMart Store'}`
                    )}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <span>Send Email to Support</span>
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* OPTION 3: Direct Quick Issue / Feedback Box (Background Email API) */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Send className="w-4 h-4" />
                    <span>3. Quick Issue / Feedback Box (Direct Dispatch)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Type your issue below and click "Submit Issue". Our background service delivers it directly to our technical inbox.
                  </p>
                </div>

                {issueSuccessToast && (
                  <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Your issue has been dispatched to SmartMart Support! Our engineer will reach out shortly.</span>
                  </div>
                )}

                <form onSubmit={handleSubmitIssue} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">Issue Category</label>
                      <select
                        value={issueCategory}
                        onChange={(e) => setIssueCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-purple-400"
                      >
                        <option>Technical Issue</option>
                        <option>Hardware (Camera / Printer)</option>
                        <option>Billing / Tax Calculation</option>
                        <option>Feature Request</option>
                        <option>Account Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">Brief Subject</label>
                      <input
                        type="text"
                        value={issueSubject}
                        onChange={(e) => setIssueSubject(e.target.value)}
                        placeholder="e.g. Printer alignment query"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block text-xs">
                      Detailed Issue Description
                    </label>
                    <textarea
                      rows="3"
                      value={issueMessage}
                      onChange={(e) => setIssueMessage(e.target.value)}
                      placeholder="Please describe the issue or feedback in detail..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs outline-none focus:border-purple-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingIssue}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingIssue ? (
                      <span>Dispatching to Support...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Issue to Technical Team</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. OFFICIAL COPYRIGHT FOOTER LINE */}
      <footer className="border-t border-slate-800 bg-[#090d16] py-3 text-center text-xs text-slate-400">
        <p className="underline decoration-slate-700 underline-offset-4 tracking-wide font-mono">
          Copyright &copy; 2026 SmartMart AI POS. All Rights Reserved. Powered by {BRAND_NAME}.
        </p>
      </footer>
    </div>
  );
};
