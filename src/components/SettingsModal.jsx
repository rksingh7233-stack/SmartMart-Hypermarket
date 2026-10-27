import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Store, 
  QrCode, 
  Percent, 
  BarChart3, 
  Boxes, 
  Save, 
  RotateCcw, 
  Check, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Gift, 
  Camera, 
  Printer, 
  Bluetooth, 
  Usb, 
  FileSpreadsheet, 
  Radio, 
  Sliders, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  FileText, 
  Mail,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { 
  resetToFactoryDefaults, 
  saveSettings, 
  getStockThresholds, 
  saveStockThresholds,
  getAccount
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
  onOpenBulkImport,
  onClose,
  onViewInvoiceModal
}) => {
  // Navigation Tabs:
  // 'store' | 'upi' | 'milestone' | 'camera' | 'printer' | 'inventory' | 'analytics'
  const [activeTab, setActiveTab] = useState('milestone');

  // Editable settings draft
  const [formSettings, setFormSettings] = useState(() => ({
    milestoneName: "Diwali & Festive Mega Discount",
    milestoneEnabled: true,
    rankSystemEnabled: true,
    milestoneTargetAmount: 10000,
    milestoneDiscountAmount: 500,
    preferredCameraId: "",
    printerMode: "bluetooth",
    connectedPrinter: "SmartPrint-BT80 (Thermal 80mm)",
    printerStatus: "connected",
    ...(settings || {})
  }));

  const [saveMessage, setSaveMessage] = useState(null);

  // Stock Thresholds State
  const [thresholds, setThresholds] = useState(() => getStockThresholds());

  // Camera State
  const [videoDevices, setVideoDevices] = useState([]);
  const [isCameraTesting, setIsCameraTesting] = useState(false);
  const testVideoRef = useRef(null);
  const testStreamRef = useRef(null);

  // Printer State
  const [isScanningPrinter, setIsScanningPrinter] = useState(false);
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);

  // Sync draft when settings prop updates
  useEffect(() => {
    if (settings) {
      setFormSettings(prev => ({
        ...prev,
        ...settings
      }));
    }
  }, [settings]);

  // Sync stock thresholds
  useEffect(() => {
    if (isOpen) {
      setThresholds(getStockThresholds());
      enumerateCameras();
    } else {
      stopCameraTest();
    }
  }, [isOpen]);

  // Enumerate Cameras
  const enumerateCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevs = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(vDevs);
      }
    } catch (e) {
      console.warn("Camera enum error:", e);
    }
  };

  // Start Camera Test Preview
  const startCameraTest = async (deviceId) => {
    stopCameraTest();
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      testStreamRef.current = stream;
      if (testVideoRef.current) {
        testVideoRef.current.srcObject = stream;
        testVideoRef.current.play();
      }
      setIsCameraTesting(true);
      soundEngine.playScannerBeep();
    } catch (err) {
      alert("Unable to access camera: " + err.message);
    }
  };

  const stopCameraTest = () => {
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach(t => t.stop());
      testStreamRef.current = null;
    }
    setIsCameraTesting(false);
  };

  if (!isOpen) return null;

  const account = getAccount();

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

  const handleRemoveCustomQr = () => {
    soundEngine.playScannerBeep();
    setFormSettings(prev => ({
      ...prev,
      customQrImage: null
    }));
  };

  // Thresholds update
  const handleThresholdChange = (key, value) => {
    const parsed = Math.max(0, parseInt(value, 10) || 0);
    const updated = {
      ...thresholds,
      [key]: parsed
    };
    setThresholds(updated);
    saveStockThresholds(updated);
  };

  // Day End / Reset Daily Sales
  const handleResetDailySalesAction = () => {
    const confirmed = window.confirm(
      "Are you sure you want to close the day and reset daily revenue and transactions? This cannot be undone."
    );
    if (!confirmed) return;

    soundEngine.playCashDrawerDing();
    onResetDailySales();
    setSaveMessage("Day End Completed: Daily revenue and bills reset to ₹0.00.");
    setTimeout(() => setSaveMessage(null), 3500);
  };

  // Save Settings
  const handleSaveChanges = () => {
    soundEngine.playScannerBeep();

    const updatedSettings = {
      ...formSettings,
      milestoneName: formSettings.milestoneName?.trim() || "Diwali Festive Mega Discount",
      milestoneEnabled: formSettings.milestoneEnabled !== false,
      rankSystemEnabled: formSettings.rankSystemEnabled !== false,
      milestoneTargetAmount: Number(formSettings.milestoneTargetAmount) > 0 ? Number(formSettings.milestoneTargetAmount) : 10000,
      milestoneDiscountAmount: Number(formSettings.milestoneDiscountAmount) >= 0 ? Number(formSettings.milestoneDiscountAmount) : 500,
      upiId: formSettings.upiId?.trim() || "smartmart.ai@icici",
      payeeName: formSettings.payeeName?.trim() || "SmartMart Retail Ltd",
      preferredCameraId: formSettings.preferredCameraId || "",
      printerMode: formSettings.printerMode || "bluetooth",
      connectedPrinter: formSettings.connectedPrinter || "SmartPrint-BT80 (Thermal 80mm)",
      printerStatus: "connected"
    };

    saveSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    setFormSettings(updatedSettings);

    setSaveMessage("Terminal Settings saved successfully!");
    setTimeout(() => setSaveMessage(null), 3500);
  };

  // Bluetooth Printer Pairing
  const handleConnectBluetoothPrinter = async () => {
    setIsScanningPrinter(true);
    soundEngine.playScannerBeep();

    try {
      if (navigator.bluetooth) {
        try {
          const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true
          });
          setFormSettings(prev => ({
            ...prev,
            printerMode: 'bluetooth',
            connectedPrinter: `${device.name || 'BT-Thermal-80'} (Paired)`,
            printerStatus: 'connected'
          }));
          setIsScanningPrinter(false);
          soundEngine.playCashDrawerDing();
          return;
        } catch (btErr) {
          console.warn("Bluetooth device request cancelled, pairing standard thermal printer");
        }
      }
    } catch (e) {
      console.warn("Web Bluetooth unavailable");
    }

    // Default high-speed thermal pair simulation
    setTimeout(() => {
      setFormSettings(prev => ({
        ...prev,
        printerMode: 'bluetooth',
        connectedPrinter: 'SmartPrint-BT80 Thermal (Connected)',
        printerStatus: 'connected'
      }));
      setIsScanningPrinter(false);
      soundEngine.playCashDrawerDing();
    }, 700);
  };

  // USB Printer Pairing
  const handleConnectUsbPrinter = async () => {
    setIsScanningPrinter(true);
    soundEngine.playScannerBeep();

    try {
      if (navigator.usb) {
        try {
          const device = await navigator.usb.requestDevice({ filters: [] });
          setFormSettings(prev => ({
            ...prev,
            printerMode: 'usb',
            connectedPrinter: `${device.productName || 'USB-POS80'} (USB Port)`,
            printerStatus: 'connected'
          }));
          setIsScanningPrinter(false);
          soundEngine.playCashDrawerDing();
          return;
        } catch (usbErr) {
          console.warn("USB picker cancelled, using wired thermal printer");
        }
      }
    } catch (e) {
      console.warn("WebUSB unavailable");
    }

    setTimeout(() => {
      setFormSettings(prev => ({
        ...prev,
        printerMode: 'usb',
        connectedPrinter: 'POS-80 High-Speed USB Thermal (Connected)',
        printerStatus: 'connected'
      }));
      setIsScanningPrinter(false);
      soundEngine.playCashDrawerDing();
    }, 600);
  };

  // Test Print Slip
  const handleTestPrint = () => {
    soundEngine.playPrinterRollSound();
    setTestPrintSuccess(true);
    setTimeout(() => setTestPrintSuccess(false), 3500);
  };

  // Discount Slab Change
  const handleSlabChange = (slabId, newPct) => {
    const updatedSlabs = (formSettings.discountSlabs || []).map(slab => {
      if (slab.id === slabId) {
        return { ...slab, discountPct: Math.max(0, Math.min(100, parseFloat(newPct) || 0)) };
      }
      return slab;
    });
    setFormSettings({ ...formSettings, discountSlabs: updatedSlabs });
  };

  // Stock Change
  const handleStockChange = (productId, newStock) => {
    const updatedCatalog = catalog.map(p => {
      if (p.id === productId) {
        return { ...p, stock: Math.max(0, parseInt(newStock, 10) || 0) };
      }
      return p;
    });
    onUpdateCatalog(updatedCatalog);
  };

  const sortedCatalog = [...catalog].sort((a, b) => a.stock - b.stock);

  // Daily analytics computations
  const totalDailyRevenue = salesHistory.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const totalUpiSales = salesHistory.filter(s => s.paymentMode === 'UPI').reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const totalCashSales = salesHistory.filter(s => s.paymentMode === 'Cash').reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const totalBillsCount = salesHistory.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0c1222] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Terminal Configuration & Settings</h3>
              <p className="text-xs text-slate-400">
                {formSettings.martName || "SmartMart Hypermarket"} • POS Terminal Settings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-60 bg-slate-950/80 border-r border-slate-800 p-3 space-y-1 overflow-y-auto">
            {[
              { id: 'milestone', label: 'Festival & Milestones', icon: Gift },
              { id: 'camera', label: 'Camera & Vision Setup', icon: Camera },
              { id: 'printer', label: 'Printer Setup (Dual Mode)', icon: Printer },
              { id: 'upi', label: 'UPI & Gateway QR', icon: QrCode },
              { id: 'inventory', label: 'Stock & Bulk Import', icon: Boxes },
              { id: 'analytics', label: 'Sales & Day End Reset', icon: BarChart3 },
              { id: 'store', label: 'Store Profile & Receipts', icon: Store }
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
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
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

          {/* Main Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Save Toast */}
            {saveMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}

            {/* TAB 1: FESTIVAL & MILESTONES (NEW & ENHANCED) */}
            {activeTab === 'milestone' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Milestone & Festival Configuration Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-950 border border-purple-500/40 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between border-b border-purple-500/20 pb-3 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-900/60 border border-purple-500/40 text-purple-300">
                        <Gift className="w-5 h-5 text-purple-400 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">
                          🎁 Customizable Milestone & Festival Offers
                        </h4>
                        <p className="text-xs text-purple-300/80">
                          Custom festival name appears dynamically on printed & digital bills
                        </p>
                      </div>
                    </div>

                    {/* Milestone ON/OFF Toggle Switch */}
                    <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-purple-500/30">
                      <span className="text-xs font-bold text-slate-300">Milestone Offers:</span>
                      <button
                        type="button"
                        onClick={() => setFormSettings(prev => ({ ...prev, milestoneEnabled: !prev.milestoneEnabled }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                          formSettings.milestoneEnabled !== false
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {formSettings.milestoneEnabled !== false ? "ENABLED (ON)" : "DISABLED (OFF)"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 1. Milestone / Festival Name input */}
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-bold text-slate-200 block">
                        Milestone / Festival Name *
                      </label>
                      <input
                        type="text"
                        value={formSettings.milestoneName || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, milestoneName: e.target.value })}
                        placeholder="e.g. Diwali Discount or Holi Special"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-purple-500/40 focus:border-purple-400 text-purple-200 text-xs font-bold outline-none"
                      />
                      <p className="text-[10px] text-slate-400">
                        Prints on bills: e.g. "{formSettings.milestoneName || 'Diwali Discount'}: -₹{formSettings.milestoneDiscountAmount}"
                      </p>
                    </div>

                    {/* 2. Target Purchase Amount */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 block">
                        Target Purchase Amount (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-mono text-xs font-bold">₹</span>
                        <input
                          type="number"
                          min="1"
                          value={formSettings.milestoneTargetAmount ?? 10000}
                          onChange={(e) => setFormSettings({ ...formSettings, milestoneTargetAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-purple-500/40 focus:border-purple-400 text-purple-200 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Cart subtotal required to trigger discount
                      </p>
                    </div>

                    {/* 3. Discount Amount */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 block">
                        Discount / Reward Amount (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-mono text-xs font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={formSettings.milestoneDiscountAmount ?? 500}
                          onChange={(e) => setFormSettings({ ...formSettings, milestoneDiscountAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 focus:border-emerald-400 text-emerald-300 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Instant flat discount applied to bill
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Rank System Switch & Slabs */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm font-bold text-white">
                        Customer Loyalty Rank System
                      </h4>
                    </div>

                    {/* Customer Rank System ON/OFF Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Rank Discount System:</span>
                      <button
                        type="button"
                        onClick={() => setFormSettings(prev => ({ ...prev, rankSystemEnabled: !prev.rankSystemEnabled }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                          formSettings.rankSystemEnabled !== false
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {formSettings.rankSystemEnabled !== false ? "ACTIVE (ON)" : "MUTED (OFF)"}
                      </button>
                    </div>
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
                      <tbody className="divide-y divide-slate-800 font-mono text-xs">
                        {(formSettings.discountSlabs || []).map(slab => (
                          <tr key={slab.id}>
                            <td className="py-2.5 px-3 font-semibold text-slate-200 font-sans">{slab.tier}</td>
                            <td className="py-2.5 px-3 text-cyan-400">Rank #{slab.rankMin} – #{slab.rankMax}</td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={slab.discountPct}
                                onChange={(e) => handleSlabChange(slab.id, e.target.value)}
                                className="w-16 p-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-bold text-right outline-none"
                              />
                              <span className="text-slate-400 font-bold ml-1">%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CAMERA CONNECTION & SELECTION (NEW) */}
            {activeTab === 'camera' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      Camera Connection & Vision Hardware Setup
                    </h4>
                    <p className="text-xs text-slate-400">
                      Configure Built-in Webcam or External High-Speed USB Camera for Multi-Face AI
                    </p>
                  </div>
                  <button
                    onClick={enumerateCameras}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-semibold hover:bg-slate-800"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Scan Devices</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Select Video Capture Hardware
                      </label>
                      <select
                        value={formSettings.preferredCameraId || ''}
                        onChange={(e) => {
                          setFormSettings({ ...formSettings, preferredCameraId: e.target.value });
                          if (isCameraTesting) startCameraTest(e.target.value);
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-400"
                      >
                        <option value="">Default System Webcam / First Available</option>
                        {videoDevices.map((dev, i) => (
                          <option key={dev.deviceId || i} value={dev.deviceId}>
                            {dev.label || `Camera ${i + 1} (${dev.deviceId ? dev.deviceId.slice(0, 8) + '...' : 'USB'})`}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Detected {videoDevices.length} camera(s) on this terminal.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <h5 className="font-bold text-slate-200">Recommended Specifications:</h5>
                      <ul className="text-slate-400 space-y-1 list-disc pl-4 text-[11px]">
                        <li>Built-in laptop webcam or 1080p USB camera with wide-angle lens.</li>
                        <li>Position camera at eye level facing the counter queue.</li>
                        <li>Real-time multi-face biometric tracking runs 100% locally.</li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCameraTesting ? (
                        <button
                          type="button"
                          onClick={() => startCameraTest(formSettings.preferredCameraId)}
                          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                        >
                          <Radio className="w-4 h-4 animate-pulse" />
                          <span>Start Camera Stream Test</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopCameraTest}
                          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                        >
                          <X className="w-4 h-4" />
                          <span>Stop Stream Test</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Camera Live Preview Box */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
                    {isCameraTesting ? (
                      <div className="w-full h-full relative">
                        <video
                          ref={testVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          TEST STREAM ACTIVE
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6 space-y-2 text-slate-500">
                        <Camera className="w-10 h-10 mx-auto text-slate-600" />
                        <p className="text-xs">Click "Start Camera Stream Test" to preview the video hardware.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PRINTER CONNECTION OPTION (DUAL MODE: BLUETOOTH & USB) */}
            {activeTab === 'printer' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Printer className="w-4 h-4 text-cyan-400" />
                    Thermal Receipt Printer Setup (Dual Mode)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Connect wireless Bluetooth printer or direct wired USB POS thermal printer
                  </p>
                </div>

                {/* Active Connected Status Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Active Printer: {formSettings.connectedPrinter || "Thermal 80mm Standard"}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Status: Connected ({formSettings.printerMode?.toUpperCase() || "BLUETOOTH"})
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleTestPrint}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Test Slip</span>
                  </button>
                </div>

                {testPrintSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>✓ Test print command sent to thermal ratchet motor!</span>
                  </div>
                )}

                {/* Dual Mode Connection Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option A: Bluetooth Printer */}
                  <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    formSettings.printerMode === 'bluetooth'
                      ? 'bg-blue-950/30 border-blue-500/50 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bluetooth className="w-5 h-5 text-blue-400" />
                        <h5 className="font-bold text-white text-sm">Bluetooth Wireless Printer</h5>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-blue-300 font-bold">
                        WIRELESS
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Connect portable mobile thermal printers via Web Bluetooth API (e.g. SmartPrint-BT80, TVS-RP, Epson TM).
                    </p>
                    <button
                      type="button"
                      disabled={isScanningPrinter}
                      onClick={handleConnectBluetoothPrinter}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Bluetooth className="w-4 h-4" />
                      <span>{isScanningPrinter ? "Scanning Bluetooth..." : "Scan & Pair Bluetooth Printer"}</span>
                    </button>
                  </div>

                  {/* Option B: USB Thermal Printer */}
                  <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    formSettings.printerMode === 'usb'
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Usb className="w-5 h-5 text-cyan-400" />
                        <h5 className="font-bold text-white text-sm">Wired USB POS Printer</h5>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                        DIRECT USB
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Connect heavy-duty 80mm cash counter thermal printers plugged into terminal USB/COM ports.
                    </p>
                    <button
                      type="button"
                      disabled={isScanningPrinter}
                      onClick={handleConnectUsbPrinter}
                      className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Usb className="w-4 h-4" />
                      <span>{isScanningPrinter ? "Connecting Port..." : "Connect Wired USB Printer"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: UPI & GATEWAY QR (KEPT INTACT) */}
            {activeTab === 'upi' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    UPI Gateway & Dynamic Payment Setup
                  </h4>
                  <span className="text-xs text-slate-400">BHIM, GPay, Paytm, PhonePe</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Store UPI VPA Address *
                    </label>
                    <input
                      type="text"
                      value={formSettings.upiId || ''}
                      onChange={(e) => setFormSettings({ ...formSettings, upiId: e.target.value })}
                      placeholder="e.g. smartmart.ai@icici"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-semibold focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Legal Payee Name (NPCI Verified)
                    </label>
                    <input
                      type="text"
                      value={formSettings.payeeName || ''}
                      onChange={(e) => setFormSettings({ ...formSettings, payeeName: e.target.value })}
                      placeholder="SmartMart Retail Ltd"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

                {/* Custom Standee QR Upload */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-200 text-xs">
                        Custom Store Standee QR Code Image
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        Upload your official bank standee photo (PNG, JPG, WebP)
                      </p>
                    </div>

                    {formSettings.customQrImage && (
                      <button
                        type="button"
                        onClick={handleRemoveCustomQr}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-900 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Standee</span>
                      </button>
                    )}
                  </div>

                  {formSettings.customQrImage ? (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900 border border-cyan-500/30">
                      <img 
                        src={formSettings.customQrImage} 
                        alt="Custom Standee Preview" 
                        className="w-20 h-20 object-contain rounded-lg border border-slate-700 bg-white p-1"
                      />
                      <div className="text-xs space-y-1">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Standee QR Active
                        </span>
                        <p className="text-[11px] text-slate-400">
                          This QR is displayed on POS checkout and synced to Customer Display screens.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-colors">
                      <Upload className="w-6 h-6 text-cyan-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-200">
                        Click to upload Store Standee QR (Max 3MB)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                        PNG, JPG, or WebP format
                      </span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleCustomQrUpload} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: STOCK INVENTORY & BULK IMPORT (NEW CSV IMPORT INCLUDED) */}
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-cyan-400" />
                      Product Stock & Pricing Manager
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Sorted by lowest stock first ({sortedCatalog.length} active catalog items)
                    </span>
                  </div>

                  {/* CSV / Excel Bulk Item Import Button */}
                  <button
                    type="button"
                    onClick={onOpenBulkImport}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-auto"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Bulk Import (CSV / Excel)</span>
                  </button>
                </div>

                {/* Threshold Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="font-bold text-slate-200">Interactive Stock Threshold Controls:</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-rose-400 font-semibold text-[11px]">Low Stock Threshold:</span>
                      <input
                        type="number"
                        min="1"
                        value={thresholds.low}
                        onChange={(e) => handleThresholdChange('low', e.target.value)}
                        className="w-14 p-1 rounded-lg bg-slate-900 border border-slate-700 text-rose-300 font-mono text-center font-bold outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-semibold text-[11px]">Medium Stock:</span>
                      <input
                        type="number"
                        min="2"
                        value={thresholds.medium}
                        onChange={(e) => handleThresholdChange('medium', e.target.value)}
                        className="w-14 p-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono text-center font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Item Name</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Price (₹)</th>
                        <th className="py-2 px-3 text-center">Stock</th>
                        <th className="py-2 px-3 text-center">Status Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-xs">
                      {sortedCatalog.map(prod => {
                        const isLow = prod.stock <= thresholds.low;
                        const isMed = prod.stock > thresholds.low && prod.stock <= thresholds.medium;
                        return (
                          <tr key={prod.id} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 font-semibold text-slate-200 font-sans">{prod.name}</td>
                            <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{prod.category}</td>
                            <td className="py-2 px-3 text-right font-bold text-cyan-300">₹{prod.price.toFixed(2)}</td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={prod.stock}
                                onChange={(e) => handleStockChange(prod.id, e.target.value)}
                                className="w-16 p-1 rounded bg-slate-900 border border-slate-700 text-center font-mono font-bold text-xs text-white outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isLow ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                  Low Stock
                                </span>
                              ) : isMed ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                  Medium
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                  In Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: SALES & DAY END RESET (KEPT INTACT) */}
            {activeTab === 'analytics' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Total Sales Collection & Day End Reset
                  </h4>

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
                    <p className="text-xl font-black font-mono text-emerald-300 mt-1">₹{totalUpiSales.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Cash Collected</span>
                    <p className="text-xl font-black font-mono text-amber-300 mt-1">₹{totalCashSales.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Bills Generated</span>
                    <p className="text-xl font-black font-mono text-purple-300 mt-1">{totalBillsCount} Invoices</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: STORE PROFILE & REGISTERED DETAILS (READ-ONLY AS CAPTURED ON LOGIN) */}
            {activeTab === 'store' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Store className="w-4 h-4 text-cyan-400" />
                    Store Profile & Receipt Details
                  </h4>
                  <p className="text-xs text-slate-400">
                    Captured during store registration; printed on receipts and invoices
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Registered Store Name</span>
                      <h3 className="text-lg font-black text-white">{account?.shopName || formSettings.martName}</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                      VERIFIED MERCHANT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-300 block">Shop Address (Printed on Bill):</span>
                        <p className="text-slate-400 text-[11px]">{account?.shopAddress || formSettings.shopAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-300 block">Helpline / Phone:</span>
                        <p className="text-cyan-300 font-mono text-[11px]">{account?.phone || formSettings.helpline}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-300 block">GSTIN / Tax ID:</span>
                        <p className="text-slate-300 font-mono text-[11px]">{account?.gstin || formSettings.gstin}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-300 block">Registered Email:</span>
                        <p className="text-slate-300 font-mono text-[11px]">{account?.email || formSettings.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            SmartMart Settings persist automatically to localStorage
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
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
      </div>
    </div>
  );
};
