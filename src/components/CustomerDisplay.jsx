import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Clock, 
  Volume2, 
  VolumeX, 
  QrCode, 
  CheckCircle2, 
  ShoppingCart, 
  Store, 
  ArrowLeft,
  Smartphone,
  Scan,
  ShieldCheck,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { syncService } from '../services/syncService';
import { soundEngine } from '../services/audioService';
import { getSettings } from '../services/storage';

export const CustomerDisplay = ({ onBackToPos }) => {
  const [settings, setSettings] = useState(() => getSettings());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Sync state received from Cashier POS
  const [syncState, setSyncState] = useState(() => syncService.getLatestState() || {
    customerName: null,
    customerId: null,
    customerAvatar: null,
    customerRank: null,
    customerTier: null,
    itemsCount: 0,
    totalPayable: 0,
    subtotal: 0,
    discount: 0,
    paymentStatus: 'IDLE', // 'IDLE' | 'PENDING' | 'SUCCESS'
    paymentMode: null,
    paidAmount: 0,
    qrData: null,
    customQrImage: null
  });

  const [generatedQrUrl, setGeneratedQrUrl] = useState('');
  const lastAnnouncedPaymentId = useRef(null);

  // Live Clock ticker & storage listener for settings
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleStorage = (e) => {
      if (e.key === 'smartmart_settings_v2') {
        setSettings(getSettings());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Subscribe to live BroadcastChannel & Storage events from Cashier POS
  useEffect(() => {
    const unsubscribe = syncService.subscribe((incoming) => {
      setSyncState((prev) => ({
        ...prev,
        ...incoming
      }));

      // Check if this is a new successful payment event to announce via Soundbox!
      if (incoming.paymentStatus === 'SUCCESS') {
        const paymentKey = `${incoming.paidAmount}-${incoming.invoiceNo || Date.now()}`;
        if (lastAnnouncedPaymentId.current !== paymentKey) {
          lastAnnouncedPaymentId.current = paymentKey;
          triggerSoundboxPaymentCelebration(incoming);
        }
      }
    });

    return () => unsubscribe();
  }, [audioUnlocked]);

  // Generate NPCI QR code if payment is pending and dynamic QR needed
  useEffect(() => {
    if (syncState.paymentStatus === 'PENDING' && !syncState.customQrImage) {
      const upiId = syncState.upiId || settings?.upiId || "smartmart.ai@icici";
      const payeeName = settings?.payeeName || "SmartMart Retail";
      const amount = (syncState.totalPayable || 0).toFixed(2);
      const upiUri = syncState.qrData || `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=SmartMart%20Checkout`;

      QRCode.toDataURL(upiUri, {
        width: 320,
        margin: 1.5,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
      .then(url => setGeneratedQrUrl(url))
      .catch(err => console.error("Customer Display QR error:", err));
    }
  }, [syncState, settings]);

  // Audio unlock helper for mobile browsers (requires 1 touch)
  const handleUnlockAudio = () => {
    soundEngine.playCashDrawerDing();
    setAudioUnlocked(true);
    soundEngine.speak("SmartMart AI Soundbox activated!");
  };

  // Payment Success Soundbox & Voice Announcement on Mobile Speaker
  const triggerSoundboxPaymentCelebration = (paymentData) => {
    soundEngine.playCashDrawerDing();

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 }
    });

    const amount = Math.round(paymentData.paidAmount || paymentData.totalPayable || 0).toLocaleString('en-IN');
    const customer = paymentData.customerName || "Customer";
    const announcement = `SmartMart AI: Rupees ${amount} received successfully from ${customer}! Thank you for shopping with us!`;

    setTimeout(() => {
      soundEngine.speak(announcement);
    }, 400);
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const isCustomerActive = Boolean(syncState.customerName);
  const isPaymentPending = syncState.paymentStatus === 'PENDING';
  const isPaymentSuccess = syncState.paymentStatus === 'SUCCESS';

  return (
    <div 
      onClick={() => { if (!audioUnlocked) handleUnlockAudio(); }}
      className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden antialiased"
    >
      {/* 1. Top Header */}
      <header className="border-b border-cyan-500/20 bg-[#0c1222]/95 backdrop-blur-md px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              {settings?.martName || "SmartMart AI"}
            </h1>
            <p className="text-[10px] text-cyan-400 font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Customer Screen & Soundbox
            </p>
          </div>
        </div>

        {/* Live Clock & Audio Unmute Button */}
        <div className="flex items-center gap-2">
          {/* Audio Unmute Pill */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUnlockAudio();
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              audioUnlocked 
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950 border border-amber-500/50 text-amber-300 animate-pulse'
            }`}
          >
            {audioUnlocked ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-mono">
              {audioUnlocked ? "Soundbox: Ready" : "Tap for Sound"}
            </span>
          </button>

          {/* Time */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formattedTime}</span>
          </div>

          {/* Back to Cashier POS link */}
          {onBackToPos && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBackToPos();
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
              title="Return to Cashier Terminal"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Mobile Center Screen */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 max-w-lg mx-auto w-full">
        {/* SCENARIO A: Payment Success Screen (Soundbox Celebration) */}
        {isPaymentSuccess ? (
          <div className="w-full rounded-3xl bg-gradient-to-b from-emerald-950/80 via-slate-900 to-slate-950 border-2 border-emerald-400 p-6 shadow-2xl text-center space-y-5 animate-receipt-roll">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/40 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold uppercase tracking-wider">
                Soundbox Payment Verified
              </span>
              <h2 className="text-3xl font-black text-white mt-2">
                ₹{(syncState.paidAmount || syncState.totalPayable || 0).toFixed(2)}
              </h2>
              <p className="text-sm font-bold text-emerald-300 mt-1">
                Payment Received via {syncState.paymentMode || 'UPI'}!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Customer:</span>
                <span className="font-bold text-slate-200">{syncState.customerName || "Customer"}</span>
              </div>
              {settings?.rankSystemEnabled !== false && (
                <div className="flex justify-between text-slate-400">
                  <span>Loyalty Tier:</span>
                  <span className="font-bold text-amber-300">Rank #{syncState.customerRank || '—'}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="font-bold text-emerald-400">Thank you for shopping!</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerSoundboxPaymentCelebration(syncState);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              <span>Replay Soundbox Voice Announcement</span>
            </button>
          </div>
        ) : isPaymentPending ? (
          /* SCENARIO B: Payment QR Display ("Scan & Pay ₹Amount") */
          <div className="w-full rounded-3xl bg-slate-900 border-2 border-cyan-400 p-5 shadow-2xl text-center space-y-4">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold uppercase tracking-wider">
                Scan with Any UPI App
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Scan & Pay ₹{(syncState.totalPayable || 0).toFixed(2)}
              </h2>
              <p className="text-xs text-slate-400">
                Billing for <strong className="text-cyan-300">{syncState.customerName || "Customer"}</strong>
              </p>
            </div>

            {/* QR Standee or Dynamic NPCI QR */}
            <div className="relative p-3 bg-white rounded-2xl shadow-xl mx-auto w-64 h-64 flex flex-col items-center justify-center border-4 border-slate-800">
              {syncState.customQrImage ? (
                <img 
                  src={syncState.customQrImage} 
                  alt="Store Standee QR" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : generatedQrUrl ? (
                <img 
                  src={generatedQrUrl} 
                  alt="Dynamic UPI QR" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-slate-500 text-xs font-mono">Generating QR...</div>
              )}
            </div>

            <div className="text-center space-y-1">
              <div className="text-[11px] font-mono text-cyan-400 font-bold">
                GPay • Paytm • PhonePe • BHIM • Amazon Pay
              </div>
              <p className="text-[10px] text-slate-400">
                Payment confirmation will be announced instantly via audio soundbox.
              </p>
            </div>
          </div>
        ) : isCustomerActive ? (
          /* SCENARIO C: Active Customer Greeting & Live Cart Summary */
          <div className="w-full rounded-3xl bg-slate-900 border border-cyan-500/30 p-5 shadow-2xl space-y-4">
            {/* Customer Greeting Header Card */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/70 to-slate-950 border border-cyan-500/30">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-md shrink-0 bg-slate-950">
                <img 
                  src={syncState.customerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"} 
                  alt={syncState.customerName} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-cyan-950/90 text-cyan-300 text-[8px] font-mono text-center font-bold">
                  VERIFIED
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-lg font-black text-white truncate">
                    Welcome, {syncState.customerName}!
                  </h3>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  {settings?.rankSystemEnabled !== false && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-1">
                      <Award className="w-3 h-3 text-cyan-400" />
                      Rank #{syncState.customerRank || '—'}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {syncState.customerId}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 mt-1 font-medium">
                  Your bill is being prepared at Counter
                </p>
              </div>
            </div>

            {/* Live Cart Financial Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 font-bold text-slate-200">
                  <ShoppingCart className="w-4 h-4 text-cyan-400" />
                  Active Cart Summary
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  {syncState.itemsCount || 0} Items
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono text-slate-200 font-bold">
                    ₹{(syncState.subtotal || 0).toFixed(2)}
                  </span>
                </div>

                {syncState.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Loyalty Savings:</span>
                    <span className="font-mono font-bold">
                      -₹{(syncState.discount || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {settings?.milestoneEnabled !== false && syncState.subtotal >= (settings?.milestoneTargetAmount || 10000) && (
                  <div className="flex justify-between text-purple-300 text-[11px] font-medium bg-purple-950/40 border border-purple-500/30 px-2 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      {settings?.milestoneName || "Festival Offer"} Unlocked:
                    </span>
                    <span className="font-mono font-bold text-purple-300">
                      -₹{(settings?.milestoneDiscountAmount || 500).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Grand Total Payable:
                  </span>
                  <span className="text-3xl font-black font-mono text-cyan-300">
                    ₹{(syncState.totalPayable || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400 font-mono">
              Please wait while the cashier scans remaining items.
            </div>
          </div>
        ) : (
          /* SCENARIO D: Idle Screen ("Welcome to SmartMart! Please look at the scanner") */
          <div className="w-full rounded-3xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl text-center space-y-6">
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping opacity-25" />
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-cyan-400 animate-spin" style={{ animationDuration: '14s' }} />
              <div className="w-20 h-20 rounded-full bg-cyan-950/60 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-xl shadow-cyan-500/20">
                <Scan className="w-10 h-10 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Welcome to {settings?.martName || "SmartMart AI"}
              </h2>
              <p className="text-sm text-cyan-300 font-medium">
                Please look at the camera scanner to load your loyalty profile & discounts.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>AI Optical Face Recognition Active</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Instant loyalty rank discounts are applied automatically when your face is verified.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 3. Bottom Bar */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 p-3 text-center text-xs text-slate-500 font-mono">
        <span>SmartMart Autonomous Retail Terminal • Express POS Zone</span>
      </footer>
    </div>
  );
};
