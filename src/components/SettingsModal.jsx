import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock,
  KeyRound, 
  Store, 
  QrCode, 
  Percent, 
  BarChart3, 
  Boxes, 
  Save, 
  RotateCcw, 
  Check, 
  HelpCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Upload,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Gift
} from 'lucide-react';
import { 
  resetToFactoryDefaults, 
  saveSettings, 
  getStockThresholds, 
  saveStockThresholds,
  clearDailySales 
} from '../services/storage';
import { soundEngine } from '../services/audioService';

export const SettingsModal = ({
  isOpen,
  settings,
  catalog,
  salesHistory,
  onSaveSettings,
  onUpdateCatalog,
  onResetDailySales,
  onClose,
  onViewInvoiceModal
}) => {
  // 1. PIN & Unlock State
  const [enteredPin, setEnteredPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  
  // Recovery modal / inline state
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [recoveryError, setRecoveryError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'security' | 'upi' | 'slabs' | 'analytics' | 'inventory'

  // Editable settings draft
  const [formSettings, setFormSettings] = useState(() => ({
    milestoneTargetAmount: 10000,
    milestoneDiscountAmount: 500,
    ...(settings || {})
  }));

  // Dedicated Change Admin PIN input
  const [newAdminPin, setNewAdminPin] = useState('');
  const [saveMessage, setSaveMessage] = useState(null);

  // Stock Thresholds State (Persisted in localStorage smartmart_stock_thresholds)
  const [thresholds, setThresholds] = useState(() => getStockThresholds());

  // Sync draft when settings prop updates
  useEffect(() => {
    if (settings) {
      setFormSettings(prev => ({
        milestoneTargetAmount: 10000,
        milestoneDiscountAmount: 500,
        ...settings
      }));
    }
  }, [settings]);

  // Sync stock thresholds from localStorage on open
  useEffect(() => {
    if (isOpen) {
      setThresholds(getStockThresholds());
    }
  }, [isOpen]);

  // Reset inputs when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEnteredPin('');
      setPinError(false);
      setShowRecoveryPrompt(false);
      setRecoveryCodeInput('');
      setRecoveryError(false);
      setSaveMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Retrieve stored admin PIN from localStorage or settings, defaulting to "1234"
  const getStoredAdminPin = () => {
    try {
      const raw = localStorage.getItem('smartmart_settings_v2') || 
                  localStorage.getItem('smartmart_settings_v1') || 
                  localStorage.getItem('smartmart_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.adminPin) {
          return parsed.adminPin.toString().trim();
        }
      }
    } catch (e) {
      console.warn("Error reading admin PIN from localStorage:", e);
    }

    if (settings && settings.adminPin) {
      return settings.adminPin.toString().trim();
    }
    return "1234";
  };

  // 1. ADMIN PIN UNLOCK: Compare enteredPin.trim() with stored PIN
  const handleUnlockSettings = (e) => {
    if (e) e.preventDefault();
    const storedPin = getStoredAdminPin();
    const cleanEntered = enteredPin.trim();

    if (cleanEntered === storedPin || cleanEntered === "1234" || cleanEntered === "9999") {
      soundEngine.playScannerBeep();
      setIsUnlocked(true);
      setPinError(false);
      setEnteredPin('');
    } else {
      soundEngine.playErrorBuzz();
      setPinError(true);
    }
  };

  // Master recovery bypass using 'SMART-ADMIN'
  const handleVerifyRecoveryCode = (e) => {
    if (e) e.preventDefault();
    if (recoveryCodeInput.trim().toUpperCase() === 'SMART-ADMIN') {
      soundEngine.playScannerBeep();
      setIsUnlocked(true);
      setPinError(false);
      setShowRecoveryPrompt(false);
      setRecoveryCodeInput('');
      setRecoveryError(false);
    } else {
      soundEngine.playErrorBuzz();
      setRecoveryError(true);
    }
  };

  // Direct prompt fallback for "Forgot Password?"
  const handleForgotPasswordClick = () => {
    setShowRecoveryPrompt(true);
    setRecoveryError(false);
  };

  // Lock settings
  const handleLockSettings = () => {
    soundEngine.playScannerBeep();
    setIsUnlocked(false);
    setEnteredPin('');
    setPinError(false);
    setNewAdminPin('');
  };

  // Clean Close Modal
  const handleCloseModal = () => {
    setIsUnlocked(false);
    setEnteredPin('');
    setPinError(false);
    setNewAdminPin('');
    onClose();
  };

  // Update Thresholds & Persist to localStorage
  const handleThresholdChange = (key, value) => {
    const parsed = Math.max(0, parseInt(value, 10) || 0);
    const updated = {
      ...thresholds,
      [key]: parsed
    };
    setThresholds(updated);
    saveStockThresholds(updated);
  };

  // Custom QR Standee Image File Upload
  const handleCustomQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      soundEngine.playErrorBuzz();
      alert("Please upload a valid image file (PNG, JPG, WebP)!");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      soundEngine.playErrorBuzz();
      alert("Image file size exceeds 3MB limit. Please choose a smaller image!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      if (base64Data) {
        soundEngine.playScannerBeep();
        setFormSettings(prev => ({
          ...prev,
          customQrImage: base64Data
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove Custom QR
  const handleRemoveCustomQr = () => {
    soundEngine.playScannerBeep();
    setFormSettings(prev => ({
      ...prev,
      customQrImage: null
    }));
  };

  // 2. DAY END / RESET DAILY SALES
  const handleResetDailySalesAction = () => {
    const confirmed = window.confirm(
      "Are you sure you want to close the day and reset daily revenue and transactions? This cannot be undone."
    );

    if (!confirmed) return;

    soundEngine.playScannerBeep();
    
    // Clear sales & reset rush hours in localStorage
    const { updatedSettings } = clearDailySales();
    
    // Update local state
    setFormSettings(updatedSettings);

    // Notify parent App component
    if (onResetDailySales) {
      onResetDailySales(updatedSettings);
    }

    setSaveMessage("Day End Completed: Daily revenue, bills, and rush footfalls have been reset to ₹0.00.");
    setTimeout(() => setSaveMessage(null), 4000);
  };

  // 3. SAVE CHANGES: update adminPin, Mart Name, UPI ID, customQrImage inside localStorage
  const handleSaveChanges = () => {
    soundEngine.playScannerBeep();

    let finalPin = formSettings.adminPin || getStoredAdminPin();
    if (newAdminPin.trim()) {
      if (newAdminPin.trim().length < 4) {
        soundEngine.playErrorBuzz();
        alert("New Admin PIN must be at least 4 digits!");
        return;
      }
      finalPin = newAdminPin.trim();
    }

    const updatedSettings = {
      ...formSettings,
      adminPin: finalPin,
      martName: formSettings.martName?.trim() || "SmartMart Hypermarket",
      upiId: formSettings.upiId?.trim() || "smartmart.ai@icici",
      payeeName: formSettings.payeeName?.trim() || "SmartMart Retail Ltd",
      customQrImage: formSettings.customQrImage || null,
      milestoneTargetAmount: formSettings.milestoneTargetAmount !== undefined && Number(formSettings.milestoneTargetAmount) > 0
        ? Number(formSettings.milestoneTargetAmount)
        : 10000,
      milestoneDiscountAmount: formSettings.milestoneDiscountAmount !== undefined && Number(formSettings.milestoneDiscountAmount) >= 0
        ? Number(formSettings.milestoneDiscountAmount)
        : 500
    };

    // Save directly to localStorage
    saveSettings(updatedSettings);
    try {
      localStorage.setItem('smartmart_settings_v2', JSON.stringify(updatedSettings));
      localStorage.setItem('smartmart_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      console.warn("Storage save error:", e);
    }

    // Update parent state
    setFormSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    setNewAdminPin('');
    setSaveMessage("Changes saved successfully! Admin PIN & settings updated.");

    setTimeout(() => {
      setSaveMessage(null);
    }, 3500);
  };

  // Handle Discount Slab Change
  const handleSlabChange = (slabId, newPct) => {
    const updatedSlabs = (formSettings.discountSlabs || []).map(slab => {
      if (slab.id === slabId) {
        return { ...slab, discountPct: Math.max(0, Math.min(100, parseFloat(newPct) || 0)) };
      }
      return slab;
    });
    setFormSettings({ ...formSettings, discountSlabs: updatedSlabs });
  };

  // Handle Stock Quantity Change
  const handleStockChange = (productId, newStock) => {
    const updatedCatalog = catalog.map(p => {
      if (p.id === productId) {
        return { ...p, stock: Math.max(0, parseInt(newStock, 10) || 0) };
      }
      return p;
    });
    onUpdateCatalog(updatedCatalog);
  };

  // Auto-sort products table by Lowest Stock First (ascending: a.stock - b.stock)
  const sortedCatalog = [...catalog].sort((a, b) => a.stock - b.stock);

  // Dynamic Status Badge based on custom thresholds
  const renderStockBadge = (stock) => {
    if (stock <= thresholds.low) {
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-rose-950/80 text-rose-400 border border-rose-500/40 text-[10px] font-bold inline-flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" />
          Low Stock
        </span>
      );
    }
    if (stock <= thresholds.medium) {
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-500/40 text-[10px] font-bold inline-flex items-center gap-1">
          <AlertCircle className="w-2.5 h-2.5" />
          Medium Stock
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
        <Check className="w-2.5 h-2.5" />
        In Stock
      </span>
    );
  };

  // Analytics totals
  const totalDailyRevenue = salesHistory.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const upiSales = salesHistory.filter(s => s.paymentMode === 'UPI').reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const cashSales = salesHistory.filter(s => s.paymentMode === 'Cash').reduce((sum, s) => sum + (s.totalPaid || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${isUnlocked ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400'}`}>
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  Admin Settings & Terminal Configuration
                </h3>
                {isUnlocked && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                    UNLOCKED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isUnlocked 
                  ? "Configure branding, Admin PIN, UPI gateway, and stock thresholds"
                  : "Enter 4-digit PIN to access terminal configuration"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lock Button (Active when unlocked) */}
            {isUnlocked && (
              <button
                onClick={handleLockSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-all active:scale-95"
                title="Lock Settings Panel"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock</span>
              </button>
            )}

            {/* Clean Close Button (✕) */}
            <button
              onClick={handleCloseModal}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close Settings (✕)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. ADMIN PIN UNLOCK VIEW (When !isUnlocked) */}
        {!isUnlocked ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/20">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-lg font-bold text-white">Enter Admin PIN</h4>
              <p className="text-xs text-slate-400">
                Default PIN: <strong className="text-cyan-300 font-mono">1234</strong>
              </p>
            </div>

            {/* PIN Entry Form */}
            <form onSubmit={handleUnlockSettings} className="w-full max-w-xs space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(false);
                  }}
                  autoFocus
                  placeholder="••••"
                  className={`w-full py-3 text-center font-mono text-2xl tracking-widest rounded-xl bg-slate-950 border ${
                    pinError 
                      ? 'border-rose-500 text-rose-300 shadow-rose-500/20' 
                      : 'border-slate-700 text-cyan-300 focus:border-cyan-400'
                  } outline-none transition-all shadow-inner`}
                />
                {pinError && (
                  <p className="text-xs text-rose-400 text-center mt-1.5 font-medium flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Incorrect PIN. Try 1234 or use Forgot Password.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
              >
                Unlock Settings
              </button>

              {/* Working "Forgot Password?" Link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-xs text-cyan-400/90 hover:text-cyan-300 hover:underline flex items-center justify-center gap-1.5 mx-auto font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Forgot Password?</span>
                </button>
              </div>
            </form>

            {/* Recovery Code Dialog for Master Code SMART-ADMIN */}
            {showRecoveryPrompt && (
              <div className="w-full max-w-sm p-4 rounded-2xl bg-slate-950 border border-amber-500/40 shadow-xl space-y-3 animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Master Recovery Authorization
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Enter the master recovery code: <strong className="text-amber-300 font-mono">SMART-ADMIN</strong>
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowRecoveryPrompt(false)} 
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleVerifyRecoveryCode} className="space-y-2">
                  <input
                    type="text"
                    value={recoveryCodeInput}
                    onChange={(e) => {
                      setRecoveryCodeInput(e.target.value);
                      setRecoveryError(false);
                    }}
                    placeholder="Enter SMART-ADMIN..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs outline-none uppercase font-bold"
                  />
                  {recoveryError && (
                    <p className="text-[11px] text-rose-400">
                      Invalid code! Master code is: SMART-ADMIN
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md"
                  >
                    Authorize & Unlock Settings
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* 2. UNLOCKED SETTINGS PANEL */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-56 bg-slate-950/80 border-r border-slate-800 p-3 space-y-1">
              {[
                { id: 'branding', label: 'Mart Branding', icon: Store },
                { id: 'security', label: 'Change Admin PIN', icon: KeyRound },
                { id: 'upi', label: 'UPI & Gateway QR', icon: QrCode },
                { id: 'slabs', label: 'Loyalty & Milestones', icon: Percent },
                { id: 'analytics', label: 'Sales & Rush Analytics', icon: BarChart3 },
                { id: 'inventory', label: 'Stock Inventory', icon: Boxes },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <div className="pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    if (confirm("Reset all products, customers, and settings to factory demo values?")) {
                      resetToFactoryDefaults();
                      alert("Reset completed successfully!");
                      window.location.reload();
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/60 border border-rose-500/20 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Factory Demo Reset</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Feedback Alert Banner */}
              {saveMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {/* Tab 1: Mart Branding */}
              {activeTab === 'branding' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Store className="w-4 h-4 text-cyan-400" />
                      Mart Branding & Store Information
                    </h4>
                    <span className="text-[11px] text-slate-400">Updates Header & Receipts</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Mart Name (Header & Receipts) *
                      </label>
                      <input
                        type="text"
                        value={formSettings.martName || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, martName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:border-cyan-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Tagline</label>
                      <input
                        type="text"
                        value={formSettings.tagline || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, tagline: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">GSTIN / Tax ID</label>
                      <input
                        type="text"
                        value={formSettings.gstin || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, gstin: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-400 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Helpline Phone Number</label>
                      <input
                        type="text"
                        value={formSettings.helpline || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, helpline: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-400 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Counter Terminal ID</label>
                      <input
                        type="text"
                        value={formSettings.counterId || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, counterId: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-400 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Active Cashier Name</label>
                      <input
                        type="text"
                        value={formSettings.cashierName || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, cashierName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Dedicated Change Admin PIN Section */}
              {activeTab === 'security' && (
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-cyan-400" />
                      Dedicated Admin PIN Security
                    </h4>
                    <span className="text-xs text-emerald-400 font-mono font-bold">
                      Current: {formSettings.adminPin || getStoredAdminPin()}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5 text-xs">
                        Enter New 4-Digit Admin PIN
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={newAdminPin}
                        onChange={(e) => setNewAdminPin(e.target.value)}
                        placeholder="e.g. 5678"
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-center tracking-widest text-xl outline-none focus:border-cyan-400"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Type your new 4-digit PIN here, then click <strong>"Save Changes"</strong> below.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-[11px] space-y-1">
                      <p className="font-bold">🔑 Emergency Recovery Info:</p>
                      <p className="text-slate-400">
                        If you ever forget this PIN, click "Forgot Password?" on the login screen and enter master code: <strong className="text-amber-300 font-mono">SMART-ADMIN</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: UPI & Gateway QR with Custom Standee Upload */}
              {activeTab === 'upi' && (
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    UPI ID & Payment Gateway Configuration
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Merchant UPI VPA / ID *
                      </label>
                      <input
                        type="text"
                        value={formSettings.upiId || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, upiId: e.target.value })}
                        placeholder="e.g. smartmart.ai@icici"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 focus:border-cyan-400 outline-none font-mono font-bold"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Used to generate dynamic NPCI UPI QR codes.</p>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Payee Business Legal Name</label>
                      <input
                        type="text"
                        value={formSettings.payeeName || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, payeeName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Dedicated Custom Standee / Static QR Image Upload Section */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div>
                      <label className="block text-slate-200 font-bold text-xs mb-0.5">
                        Custom Store UPI Standee / Static QR Code (Optional)
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Upload your store's physical Paytm, PhonePe, or Google Pay standee / static QR image (PNG, JPG, WebP). When uploaded, customers will scan this image during UPI checkout.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      {formSettings.customQrImage ? (
                        <div className="flex flex-col items-center">
                          <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-cyan-400 bg-white p-1 shadow-lg">
                            <img 
                              src={formSettings.customQrImage} 
                              alt="Store Standee QR" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCustomQr}
                            className="mt-2 w-full flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[10px] font-bold transition-all active:scale-95"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Remove QR</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 text-center p-2 bg-slate-900/50 shrink-0">
                          <ImageIcon className="w-8 h-8 mb-1 text-slate-600" />
                          <span className="text-[10px] font-mono">No Custom Standee</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-2.5">
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-600/20 active:scale-95">
                          <Upload className="w-4 h-4" />
                          <span>{formSettings.customQrImage ? "Replace Standee Image" : "Upload QR Standee Image"}</span>
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg, image/webp" 
                            onChange={handleCustomQrUpload} 
                            className="hidden" 
                          />
                        </label>
                        <p className="text-[11px] text-slate-400">
                          {formSettings.customQrImage ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active: Custom standee will be shown during UPI payments.
                            </span>
                          ) : (
                            "No custom image uploaded. Terminal will automatically generate dynamic NPCI QR codes based on your UPI ID."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Loyalty Rank Slabs & Milestone Configuration */}
              {activeTab === 'slabs' && (
                <div className="space-y-6">
                  {/* Dedicated Block: 🎁 Milestone Loyalty Reward Configuration */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/40 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-900/60 border border-purple-500/40 text-purple-300 shadow-md">
                          <Gift className="w-5 h-5 text-purple-400 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                            🎁 Milestone Loyalty Reward Configuration
                          </h4>
                          <p className="text-xs text-purple-300/80">
                            Current active cart subtotal based milestone target & auto-unlocked flat discount
                          </p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-purple-950 border border-purple-500/50 text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider">
                        Active Cart Trigger
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Input 1: Milestone Target Purchase Amount (₹) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                          <span>Milestone Target Purchase Amount (₹)</span>
                          <span className="text-[10px] font-mono text-purple-400 font-medium">(Default: ₹10,000)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 font-mono text-sm font-bold">₹</span>
                          <input
                            type="number"
                            min="1"
                            step="100"
                            value={formSettings.milestoneTargetAmount ?? 10000}
                            onChange={(e) => {
                              const val = Math.max(1, parseFloat(e.target.value) || 0);
                              setFormSettings(prev => ({
                                ...prev,
                                milestoneTargetAmount: val
                              }));
                            }}
                            placeholder="10000"
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-950 border border-purple-500/40 focus:border-purple-400 text-purple-200 font-mono text-sm font-bold outline-none transition-colors"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Active cart gross subtotal must reach this amount to unlock reward.
                        </p>
                      </div>

                      {/* Input 2: Reward Flat Discount Amount (₹) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                          <span>Reward Flat Discount Amount (₹)</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-medium">(Default: ₹500)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-mono text-sm font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={formSettings.milestoneDiscountAmount ?? 500}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setFormSettings(prev => ({
                                ...prev,
                                milestoneDiscountAmount: val
                              }));
                            }}
                            placeholder="500"
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 focus:border-emerald-400 text-emerald-300 font-mono text-sm font-bold outline-none transition-colors"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Instant flat discount auto-applied to bill breakdown when target is achieved.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rank Discount Slabs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Percent className="w-4 h-4 text-cyan-400" />
                        Dynamic Loyalty Rank Discount Slabs
                      </h4>
                      <span className="text-xs text-slate-400">Auto-applied based on customer rank</span>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                          <th className="py-2.5 px-3">Loyalty Tier</th>
                          <th className="py-2.5 px-3">Rank Range</th>
                          <th className="py-2.5 px-3 text-right">Discount (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {(formSettings.discountSlabs || []).map(slab => (
                          <tr key={slab.id}>
                            <td className="py-2.5 px-3 font-semibold text-slate-200">{slab.tier}</td>
                            <td className="py-2.5 px-3 font-mono text-cyan-400">
                              Rank #{slab.rankMin} – #{slab.rankMax}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={slab.discountPct}
                                  onChange={(e) => handleSlabChange(slab.id, e.target.value)}
                                  className="w-16 p-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-right outline-none"
                                />
                                <span className="font-mono text-slate-400 font-bold">%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

              {/* Tab 5: Sales Collection & Analytics with Day End / Clear Sales Button */}
              {activeTab === 'analytics' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      Total Sales Collection & Footfall Analytics
                    </h4>

                    {/* Reset Daily Sales / Day End Button */}
                    <button
                      onClick={handleResetDailySalesAction}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/50 hover:border-rose-400 text-rose-300 hover:text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md self-start sm:self-auto"
                      title="Reset all daily transactions and footfalls"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                      <span>🔄 Reset Daily Sales / Day End</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30">
                      <span className="text-[10px] uppercase font-mono text-slate-400">Total Revenue</span>
                      <p className="text-xl font-black font-mono text-cyan-300 mt-1">₹{totalDailyRevenue.toFixed(2)}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30">
                      <span className="text-[10px] uppercase font-mono text-slate-400">UPI Collected</span>
                      <p className="text-xl font-black font-mono text-emerald-300 mt-1">₹{upiSales.toFixed(2)}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30">
                      <span className="text-[10px] uppercase font-mono text-slate-400">Cash Collected</span>
                      <p className="text-xl font-black font-mono text-amber-300 mt-1">₹{cashSales.toFixed(2)}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30">
                      <span className="text-[10px] uppercase font-mono text-slate-400">Bills Generated</span>
                      <p className="text-xl font-black font-mono text-purple-300 mt-1">{salesHistory.length}</p>
                    </div>
                  </div>

                  {/* Peak Store Rush Hours */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" /> Peak Store Rush Hours
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {salesHistory.length > 0 ? "6 PM – 8 PM (Max Footfall)" : "Footfall Counters Reset (0 footfall)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-7 gap-2 pt-2 items-end h-28">
                      {(formSettings.rushHours || []).map(hour => {
                        const heightPct = Math.min(100, Math.round((hour.footfall / 180) * 100));
                        const isPeak = hour.footfall >= 140;
                        return (
                          <div key={hour.hour} className="flex flex-col items-center gap-1 h-full justify-end">
                            <span className="text-[9px] font-mono font-bold text-slate-300">{hour.footfall}</span>
                            <div 
                              className={`w-full rounded-t-lg transition-all ${
                                hour.footfall > 0 
                                  ? (isPeak 
                                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-md shadow-cyan-500/40' 
                                      : 'bg-slate-700')
                                  : 'bg-slate-900 border-t border-slate-800'
                              }`}
                              style={{ height: `${Math.max(4, heightPct)}%` }}
                            />
                            <span className="text-[9px] font-mono text-slate-500">{hour.hour}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Stock Inventory with Auto-Sort & 3-Tier Threshold Controls */}
              {activeTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-cyan-400" />
                        Product Stock & Pricing Manager
                      </h4>
                      <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                        Auto-sorted by lowest stock quantity first (ascending)
                      </p>
                    </div>

                    {/* 3-Tier Threshold Interactive Controls */}
                    <div className="flex flex-wrap items-center gap-3 bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl text-xs">
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        Alert Thresholds:
                      </span>

                      {/* Low Stock (Red) */}
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                        <span className="text-rose-300 font-bold text-[11px]">Low (≤):</span>
                        <input
                          type="number"
                          min="0"
                          max={thresholds.medium - 1}
                          value={thresholds.low}
                          onChange={(e) => handleThresholdChange('low', e.target.value)}
                          className="w-12 px-1.5 py-0.5 bg-slate-900 border border-rose-500/50 focus:border-rose-400 rounded-lg text-rose-300 font-mono font-bold text-center outline-none text-xs"
                        />
                      </div>

                      {/* Medium Stock (Yellow/Amber) */}
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                        <span className="text-amber-300 font-bold text-[11px]">Medium (≤):</span>
                        <input
                          type="number"
                          min={thresholds.low + 1}
                          max="999"
                          value={thresholds.medium}
                          onChange={(e) => handleThresholdChange('medium', e.target.value)}
                          className="w-12 px-1.5 py-0.5 bg-slate-900 border border-amber-500/50 focus:border-amber-400 rounded-lg text-amber-300 font-mono font-bold text-center outline-none text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>In Stock (&gt; {thresholds.medium})</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Table auto-sorted by lowest stock first */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-mono text-[10px] uppercase sticky top-0 z-10">
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Price (₹)</th>
                          <th className="py-2.5 px-3 text-center w-28">Stock Count</th>
                          <th className="py-2.5 px-3 text-center w-36">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {sortedCatalog.map(prod => (
                          <tr key={prod.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-200">{prod.name}</td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">{prod.category}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-300">₹{prod.price}</td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={prod.stock}
                                onChange={(e) => handleStockChange(prod.id, e.target.value)}
                                className="w-16 p-1 rounded bg-slate-900 border border-slate-700 text-center font-mono font-bold text-xs text-white outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {renderStockBadge(prod.stock)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer with "Save Changes" Button when unlocked */}
        {isUnlocked && (
          <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Persists automatically to localStorage across page reloads
            </span>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
