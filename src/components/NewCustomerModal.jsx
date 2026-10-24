import React, { useState, useEffect } from 'react';
import { X, UserPlus, Camera, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { soundEngine } from '../services/audioService';

export const NewCustomerModal = ({ isOpen, onClose, onAddCustomer, initialData }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('Indiranagar, Bangalore');
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  // Sync snapshot from live camera feed
  useEffect(() => {
    if (initialData?.avatar) {
      setCapturedPhoto(initialData.avatar);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      soundEngine.playErrorBuzz();
      alert("Please provide customer name and mobile number");
      return;
    }

    const uniqueId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    const salutation = `${name.trim()} ji`;

    const newCustomer = {
      id: uniqueId,
      name: name.trim(),
      salutation,
      mobile: mobile.trim().startsWith('+91') ? mobile.trim() : `+91 ${mobile.trim()}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      address: address.trim() || "Local Resident, Bangalore",
      rank: 50, // Initial Bronze/New rank
      tier: "Bronze VIP",
      visits: 1,
      lastVisitDate: "First Visit Today",
      lastBuyAmount: 0,
      cumulativeSpend: 0,
      milestoneTarget: 5000,
      rewardRewardDesc: "Welcome Perk: Instant ₹100 Welcome gift discount on your first bill above ₹500!",
      avatar: capturedPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      descriptor: initialData?.descriptor || null, // 128-float biometric face vector
      habitItem: "Basmati Premium Rice (5kg)",
      habitPrompt: `Welcome ${salutation}! First-time customer at SmartMart AI.`,
      status: "NEW CUSTOMER (1st Visit)",
      emotion: "Smiling (98%)",
      ageEst: "Adult",
      pastPurchases: []
    };

    soundEngine.playScannerBeep();
    onAddCustomer(newCustomer);

    // Warm greeting
    soundEngine.speak(`Welcome to SmartMart, ${salutation}! Your profile has been created and your face is registered.`);

    // Reset and close
    setName('');
    setMobile('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Register New Customer</h3>
              <p className="text-xs text-slate-400">Live AI Biometric & Profile Registration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Live Face Snapshot Preview */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-md shrink-0 bg-slate-900 flex items-center justify-center">
              {capturedPhoto ? (
                <img src={capturedPhoto} alt="Live Face Snapshot" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-slate-500" />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-emerald-950/90 text-emerald-300 text-[8px] font-mono text-center py-0.5 font-bold">
                FACE SNAP
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-200 block text-xs">Real Live Face Snapshot</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {initialData?.descriptor ? "✓ 128-d Biometric Vector Extracted" : "✓ Snapshot Captured from Webcam"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma or Priya Verma"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Mobile Number (for WhatsApp e-Bill) *</label>
            <input
              type="text"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 98765 43210"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono font-bold focus:border-emerald-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Flat 402, Lotus Towers, Bangalore"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-emerald-400 outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-[11px] leading-tight">
            ✨ Auto-enrolled in SmartMart AI Loyalty Club with <strong>Rank #50 Welcome Privileges</strong>!
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/25"
            >
              Save & Register Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
