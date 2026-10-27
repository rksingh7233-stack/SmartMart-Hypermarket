import React from 'react';
import { 
  Sparkles, 
  Clock, 
  ShieldAlert, 
  Check, 
  ArrowRight, 
  RotateCcw,
  Store
} from 'lucide-react';
import { extendTrial, getAccount } from '../services/storage';
import { soundEngine } from '../services/audioService';

export const TrialExpiredModal = ({ onExtendSuccess }) => {
  const account = getAccount();

  const handleExtend = () => {
    soundEngine.playCashDrawerDing();
    extendTrial(30);
    soundEngine.speak("30-Day trial extended successfully! Full terminal access restored.");
    onExtendSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0c1222] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Glow & Badge */}
        <div className="w-16 h-16 rounded-3xl bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/30 animate-bounce">
          <Clock className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold uppercase tracking-wider">
            30-Day Trial Expired
          </span>
          <h2 className="text-2xl font-black text-white mt-2">
            Your Free Trial Has Ended
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {account?.shopName || "Your store"}'s complimentary 30-day full-access trial for SmartMart AI POS Terminal has expired.
          </p>
        </div>

        {/* Subscription Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Monthly Plan</span>
            <div className="text-xl font-black text-white font-mono">₹999 <span className="text-xs text-slate-400 font-sans">/ month</span></div>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Multi-Face CV Detection</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Thermal Receipts</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border border-cyan-500/40 space-y-2 relative overflow-hidden">
            <span className="text-[10px] font-mono font-bold uppercase text-cyan-300">Annual Enterprise (Best Value)</span>
            <div className="text-xl font-black text-white font-mono">₹8,999 <span className="text-xs text-slate-400 font-sans">/ year</span></div>
            <ul className="text-[11px] text-slate-300 space-y-1">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> All Pro Features + Soundbox</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> Dual Bluetooth & USB Printing</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleExtend}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Renew Access / Extend Demo (+30 Days Free)</span>
          </button>

          <p className="text-[11px] text-slate-500 font-mono">
            Hackathon demonstration mode: Instantly extend your trial anytime with 1 click.
          </p>
        </div>
      </div>
    </div>
  );
};
