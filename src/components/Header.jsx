import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Lock, 
  Clock, 
  Calendar, 
  Radio, 
  Cpu, 
  Volume2, 
  Store,
  UserCheck,
  Smartphone,
  ExternalLink,
  QrCode,
  X,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import QRCode from 'qrcode';

export const Header = ({ 
  settings, 
  onOpenSettings, 
  activeCustomer,
  onOpenCustomerDisplay,
  trialInfo,
  onLogout 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileQrUrl, setMobileQrUrl] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate QR for opening on real mobile device
  useEffect(() => {
    if (showMobileModal) {
      const customerUrl = `${window.location.origin}/#/customer`;
      QRCode.toDataURL(customerUrl, {
        width: 220,
        margin: 1.5,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
      .then(url => setMobileQrUrl(url))
      .catch(e => console.error(e));
    }
  }, [showMobileModal]);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handleOpenCustomerDisplay = () => {
    window.open(`${window.location.origin}/#/customer`, '_blank');
  };

  return (
    <header className="border-b border-cyan-500/20 bg-[#0c1222]/90 backdrop-blur-md px-4 py-3 sticky top-0 z-30">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Terminal Badges */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#090d16] animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#090d16]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                {settings?.martName || "SmartMart AI"}
              </h1>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center gap-1 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                Smart POS Terminal
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Store className="w-3.5 h-3.5 text-cyan-400" />
                {settings?.counterId || "TERMINAL-04 (Express AI)"}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Cashier: <span className="text-slate-300 font-medium">{settings?.cashierName?.split(' ')[0] || "Aakash"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Real-Time CV & Soundbox Engine Status Indicators */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 text-emerald-400 font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Multi-Face CV: <strong className="text-emerald-300">Active</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 text-cyan-400 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Soundbox: <strong className="text-cyan-300">Synced</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 text-purple-400 font-medium">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Sync: <strong className="text-purple-300">BroadcastChannel</strong></span>
          </div>
        </div>

        {/* Right: Actions, Free Trial Badge, Live Clock, Settings & Logout */}
        <div className="flex items-center gap-2.5">
          {/* 30-Day Free Trial Remaining Days Badge */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono text-xs shadow-inner"
            title="30-Day Free Demo Trial License"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">{trialInfo?.daysRemaining ?? 30} Days Left</span>
            <span className="text-[10px] text-cyan-400/80 hidden xl:inline">(Free Trial)</span>
          </div>

          {/* Dedicated Customer Display Toggle Button */}
          <div className="flex items-center">
            <button
              onClick={handleOpenCustomerDisplay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              title="Open Customer Display in a new tab"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">📱 Customer Display</span>
              <span className="sm:hidden">📱 Screen</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
            <button
              onClick={() => setShowMobileModal(true)}
              className="p-1.5 rounded-r-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border-l border-emerald-500/40"
              title="Scan QR to open on mobile phone"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>

          {/* Live Clock & Date */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs shadow-inner">
            <div className="flex items-center gap-1.5 text-slate-300 font-mono">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formattedDate}</span>
            </div>
            <span className="text-cyan-700">|</span>
            <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold tracking-wider">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '60s' }} />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Settings Button (PIN/Password Protected) */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-cyan-950 hover:to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 hover:text-white transition-all text-xs font-semibold shadow-md hover:shadow-cyan-500/20 active:scale-95 group"
            title="Access Admin Settings"
          >
            <div className="p-1 rounded-md bg-cyan-950/80 group-hover:bg-cyan-500/20 text-cyan-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* User Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-200 transition-all text-xs font-semibold shadow-md active:scale-95 group"
              title="Log Out of Store Session"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile QR Modal for Scanning with Phone Camera */}
      {showMobileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Open on Customer's Mobile Phone
              </span>
              <button onClick={() => setShowMobileModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Scan this QR code with your mobile phone camera to open the real-time Customer Screen & Audio Soundbox:
            </p>

            <div className="p-3 bg-white rounded-2xl mx-auto w-52 h-52 flex items-center justify-center shadow-lg border-2 border-slate-800">
              {mobileQrUrl ? (
                <img src={mobileQrUrl} alt="Mobile Screen QR" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <span className="text-xs text-slate-500">Generating QR...</span>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 select-all break-all">
              {`${window.location.origin}/#/customer`}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowMobileModal(false);
                  handleOpenCustomerDisplay();
                }}
                className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                Open in New Tab
              </button>
              <button
                onClick={() => setShowMobileModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
