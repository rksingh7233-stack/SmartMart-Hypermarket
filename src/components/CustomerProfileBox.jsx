import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Award, 
  Volume2, 
  Search, 
  ChevronDown, 
  Sparkles,
  Camera,
  UserCheck
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

export const CustomerProfileBox = ({
  activeCustomer,
  customers,
  onSelectCustomer
}) => {
  const [lookupInput, setLookupInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);

  // Handle manual lookup by ID or Mobile
  const handleLookup = () => {
    if (!lookupInput.trim()) return;
    const term = lookupInput.trim().toLowerCase();

    const found = customers.find(c => 
      c.id.toLowerCase() === term ||
      c.mobile.replace(/\s+/g, '').includes(term.replace(/\s+/g, '')) ||
      c.name.toLowerCase().includes(term)
    );

    if (found) {
      soundEngine.playScannerBeep();
      onSelectCustomer(found);
      setLookupInput('');
    } else {
      soundEngine.playErrorBuzz();
      alert(`No customer found with ID or Mobile: "${lookupInput}"`);
    }
  };

  // Generate dynamic AI Greeting quote
  const getGreetingQuote = () => {
    if (!activeCustomer) return "Welcome to SmartMart AI! Step in front of the camera or scan customer face.";

    if (activeCustomer.visits <= 1) {
      return `Welcome to SmartMart, ${activeCustomer.salutation || activeCustomer.name}! Enjoy your first visit perks and exclusive member discounts today.`;
    }

    return `Welcome back, ${activeCustomer.salutation || activeCustomer.name}! Today is your ${activeCustomer.visits}th visit to our mall.`;
  };

  const handlePlayVoice = () => {
    const greeting = getGreetingQuote();
    setIsSpeaking(true);
    soundEngine.speak(greeting, () => {
      setIsSpeaking(false);
    });
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3.5 shadow-xl">
      {/* Top Customer ID / Mobile lookup box with Load button & Saved List dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            value={lookupInput}
            onChange={(e) => setLookupInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="Search Saved ID or Mobile..."
            className="w-full pl-3 pr-16 py-1.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs font-mono text-slate-200 outline-none"
          />
          <button
            onClick={handleLookup}
            className="absolute right-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[11px] transition-all"
          >
            Load
          </button>
        </div>

        {/* Saved List Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSavedDropdown(!showSavedDropdown)}
            className="w-full sm:w-auto flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium"
          >
            <span>Saved ({customers.length})</span>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          {showSavedDropdown && (
            <div className="absolute right-0 mt-1 w-64 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl py-1 z-30 max-h-56 overflow-y-auto">
              {customers.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 font-mono">
                  No customers registered yet.<br />Register face using webcam!
                </div>
              ) : (
                customers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c);
                      setShowSavedDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-cyan-950/60 flex items-center gap-2 text-xs border-b border-slate-800 last:border-none"
                  >
                    <img src={c.avatar} alt={c.name} className="w-6 h-6 rounded-full object-cover border border-cyan-500/40" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-200 truncate">{c.name}</p>
                      <p className="text-[10px] text-cyan-400 font-mono">{c.id} • Rank #{c.rank}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Customer Header Info & Real Live Face Snapshot */}
      {!activeCustomer ? (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-1">
          <Camera className="w-7 h-7 text-cyan-400/60 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">No Customer Active</p>
          <p className="text-[11px] text-slate-500">
            Stand in front of the camera to recognize or register customer.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          {/* Real Live Face Snapshot (captured photo snapshot avatar as specified in Requirement 3) */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-cyan-400/80 shadow-md shrink-0 bg-slate-900">
            <img 
              src={activeCustomer.avatar} 
              alt={activeCustomer.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-cyan-950/90 text-cyan-300 text-[8px] font-mono text-center py-0.5 font-bold">
              LIVE SNAP
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-slate-100 truncate">
                {activeCustomer.name}
              </h3>
              <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/60 text-cyan-300 text-xs font-mono font-bold">
                Rank #{activeCustomer.rank}
              </span>
            </div>

            <div className="mt-1 space-y-0.5 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-mono text-slate-300">{activeCustomer.mobile}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-[11px] text-slate-400">{activeCustomer.id}</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-[11px] text-slate-400 truncate">{activeCustomer.address}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Greeting Box with AI Voice Quote & Voice Button */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-950/80 to-slate-950 border border-cyan-500/30 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>AI Cashier Voice Engine</span>
            </div>
            <p className="text-xs text-slate-200 font-medium italic">
              "{getGreetingQuote()}"
            </p>
          </div>

          {/* Clickable Voice Button */}
          <button
            onClick={handlePlayVoice}
            disabled={isSpeaking}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md ${
              isSpeaking
                ? 'bg-cyan-500 text-slate-950 animate-pulse'
                : 'bg-cyan-950/80 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/40'
            }`}
            title="Play AI synthesized greeting"
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
            <span>{isSpeaking ? "Speaking..." : "Voice"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
