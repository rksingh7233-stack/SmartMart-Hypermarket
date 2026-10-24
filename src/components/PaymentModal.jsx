import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Banknote, 
  QrCode, 
  Split, 
  CheckCircle2, 
  Volume2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Radio,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { soundEngine } from '../services/audioService';

export const PaymentModal = ({
  mode,
  billing,
  settings,
  activeCustomer,
  onSuccess,
  onClose
}) => {
  const { totalPayable, subtotal, rankDiscountAmount, milestoneDiscountAmount = 0, extraDiscountAmount } = billing;

  // Cash state
  const [cashTendered, setCashTendered] = useState(totalPayable);
  const changeToReturn = Math.max(0, cashTendered - totalPayable);

  // Split state
  const [splitCash, setSplitCash] = useState(Math.round(totalPayable / 2));
  const splitUpi = Math.max(0, totalPayable - splitCash);

  // Dynamic UPI state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Determine active UPI amount (either full totalPayable or split portion)
  const upiAmount = mode === 'Split' ? splitUpi : totalPayable;

  // Generate Dynamic NPCI UPI QR code if needed as fallback
  useEffect(() => {
    if (mode === 'UPI' || mode === 'Split') {
      const upiId = settings?.upiId || "smartmart.ai@icici";
      const payeeName = settings?.payeeName || "SmartMart AI Retail";
      const txnRef = `SM${Date.now().toString().slice(-6)}`;
      
      // Standard NPCI UPI URI Scheme
      const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${upiAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`SmartMart Bill ${txnRef}`)}`;

      QRCode.toDataURL(upiUri, {
        width: 260,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error("QR Code generation error:", err));
    }
  }, [mode, upiAmount, settings]);

  // Quick cash buttons
  const addCash = (amount) => {
    setCashTendered(prev => prev + amount);
  };

  // Complete Payment Action
  const handleCompletePayment = (effectiveMode) => {
    setIsProcessing(true);

    if (effectiveMode === 'Cash') {
      soundEngine.playCashDrawerDing();
      soundEngine.announcePaymentSuccess(totalPayable, 'Cash');
    } else if (effectiveMode === 'UPI') {
      soundEngine.announcePaymentSuccess(totalPayable, 'UPI');
    } else {
      soundEngine.announcePaymentSuccess(totalPayable, 'Split Mode');
    }

    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setIsVerified(true);

    setTimeout(() => {
      onSuccess({
        paymentMode: effectiveMode,
        cashTendered: effectiveMode === 'Cash' ? cashTendered : (effectiveMode === 'Split' ? splitCash : 0),
        changeReturned: effectiveMode === 'Cash' ? changeToReturn : 0,
        splitDetails: effectiveMode === 'Split' ? { cash: splitCash, upi: splitUpi } : null,
        totalPaid: totalPayable,
        subtotal,
        rankDiscountAmount,
        milestoneDiscountAmount,
        extraDiscountAmount,
        date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        invoiceNo: `SM-${Date.now().toString().slice(-8)}`
      });
    }, 900);
  };

  // Check if custom store standee image is available
  const hasCustomQrImage = Boolean(settings?.customQrImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              {mode === 'Cash' && <Banknote className="w-5 h-5 text-emerald-400" />}
              {mode === 'UPI' && <QrCode className="w-5 h-5 text-cyan-400" />}
              {mode === 'Split' && <Split className="w-5 h-5 text-purple-400" />}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                {mode === 'Cash' && "Cash Settlement Terminal"}
                {mode === 'UPI' && (hasCustomQrImage ? "Store Official UPI Standee QR" : "Dynamic UPI Soundbox QR Payment")}
                {mode === 'Split' && "Split Payment (Cash + UPI)"}
              </h3>
              <p className="text-xs text-slate-400">
                Customer: <strong className="text-cyan-300">{activeCustomer?.name || "Guest Customer"}</strong> (Rank #{activeCustomer?.rank || "—"})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Payable Banner */}
        <div className="bg-cyan-950/40 px-6 py-3 border-b border-cyan-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
              Total Payable Amount:
            </span>
            {milestoneDiscountAmount > 0 && (
              <span className="block text-[10px] text-purple-300 font-medium">
                🎁 Milestone Discount: -₹{milestoneDiscountAmount.toFixed(2)} applied
              </span>
            )}
          </div>
          <span className="text-2xl font-black font-mono text-cyan-300">
            ₹{totalPayable.toFixed(2)}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* 1. Cash Mode UI */}
          {mode === 'Cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Cash Tendered by Customer (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={totalPayable}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 text-lg font-mono font-bold text-emerald-300 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-slate-500 font-bold">
                    INR
                  </span>
                </div>
              </div>

              {/* Quick Rupee Chips */}
              <div className="flex flex-wrap items-center gap-2">
                {[100, 200, 500, 1000, 2000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => addCash(val)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-semibold text-slate-200 active:scale-95 transition-all"
                  >
                    +₹{val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCashTendered(totalPayable)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-xs font-bold text-emerald-300 active:scale-95 transition-all"
                >
                  Exact (₹{totalPayable.toFixed(2)})
                </button>
              </div>

              {/* Change Return Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-mono">Change to Return Cashier:</span>
                  <span className="text-xs text-slate-500">Hand back to customer</span>
                </div>
                <span className={`text-2xl font-black font-mono ${changeToReturn > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                  ₹{changeToReturn.toFixed(2)}
                </span>
              </div>

              {/* Confirm Cash */}
              <button
                onClick={() => handleCompletePayment('Cash')}
                disabled={cashTendered < totalPayable || isProcessing}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98 ${
                  cashTendered < totalPayable || isProcessing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Cash Received & Print Receipt</span>
              </button>
            </div>
          )}

          {/* 2. UPI Mode UI (Supports Custom QR Standee Image or Dynamic Fallback) */}
          {mode === 'UPI' && (
            <div className="flex flex-col items-center space-y-4">
              {/* QR Container */}
              <div className="relative p-3 bg-white rounded-2xl shadow-xl border-4 border-cyan-400/80 flex flex-col items-center">
                {hasCustomQrImage ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={settings.customQrImage} 
                      alt="Custom Store Standee QR" 
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                    <div className="mt-1 text-[10px] font-mono font-bold text-slate-800 uppercase tracking-wider">
                      Store Official Standee QR
                    </div>
                  </div>
                ) : qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Scan UPI QR Code" 
                    className="w-56 h-56 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                    Generating QR...
                  </div>
                )}
                <div className="absolute -bottom-3 inset-x-6 bg-slate-950 text-cyan-300 border border-cyan-400/50 rounded-full py-0.5 text-[10px] font-mono text-center font-bold shadow-md">
                  GPay • Paytm • PhonePe • BHIM
                </div>
              </div>

              {/* Soundbox Real-Time Pulse Indicator */}
              <div className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                    <Radio className="w-4 h-4 animate-ping absolute opacity-40 text-cyan-400" />
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">AI Soundbox Listener</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Listening on {settings?.upiId}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold animate-pulse">
                  Ready to Capture
                </span>
              </div>

              {/* Hackathon Simulation Trigger Button */}
              <button
                onClick={() => handleCompletePayment('UPI')}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>Simulate Customer Scan & Pay (Auto-Verify)</span>
              </button>
            </div>
          )}

          {/* 3. Split Mode UI */}
          {mode === 'Split' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Cash Portion */}
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5" /> Cash Portion
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={totalPayable}
                    value={splitCash}
                    onChange={(e) => {
                      const val = Math.min(totalPayable, Math.max(0, parseFloat(e.target.value) || 0));
                      setSplitCash(val);
                    }}
                    className="w-full py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold text-sm outline-none"
                  />
                </div>

                {/* UPI Portion */}
                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-1">
                  <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" /> UPI Portion
                  </span>
                  <div className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-sm">
                    ₹{splitUpi.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Slider for smooth splitting */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={totalPayable}
                  step="1"
                  value={splitCash}
                  onChange={(e) => setSplitCash(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>100% UPI (₹0 Cash)</span>
                  <span>100% Cash (₹0 UPI)</span>
                </div>
              </div>

              {/* QR Preview for the split UPI part (Custom standee or dynamic fallback) */}
              {splitUpi > 0 && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="w-16 h-16 rounded bg-white p-1 flex items-center justify-center shrink-0">
                    {hasCustomQrImage ? (
                      <img src={settings.customQrImage} alt="Custom Store Standee" className="w-full h-full object-contain" />
                    ) : (
                      <img src={qrCodeDataUrl} alt="UPI QR" className="w-full h-full object-contain" />
                    )}
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-200">Scan for ₹{splitUpi.toFixed(2)} UPI</p>
                    <p className="text-[10px] text-slate-400">
                      {hasCustomQrImage ? "Store Official Standee QR" : "Dynamic NPCI QR"} • Balance ₹{splitCash.toFixed(2)} in cash
                    </p>
                  </div>
                </div>
              )}

              {/* Confirm Split */}
              <button
                onClick={() => handleCompletePayment('Split')}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/25 transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete Split Payment (Cash + UPI)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
