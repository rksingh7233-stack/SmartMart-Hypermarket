import React, { useState } from 'react';
import { 
  Banknote, 
  QrCode, 
  Split, 
  Tag, 
  Award, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Receipt,
  Gift
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

export const BillingSummary = ({
  cart,
  activeCustomer,
  settings,
  extraDiscount,
  onUpdateExtraDiscount,
  onInitiatePayment
}) => {
  const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percent'

  // Calculate gross subtotal
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Determine Rank Discount % based on activeCustomer and settings
  const getRankDiscountPct = () => {
    if (!activeCustomer || !settings?.discountSlabs) return 0;
    const rank = activeCustomer.rank || 999;
    
    const matchedSlab = settings.discountSlabs.find(slab => 
      rank >= slab.rankMin && rank <= slab.rankMax
    );

    return matchedSlab ? matchedSlab.discountPct : 0;
  };

  const rankDiscountPct = getRankDiscountPct();
  const rankDiscountAmount = (subtotal * rankDiscountPct) / 100;

  // Milestone Loyalty Reward based on present active cart subtotal
  const milestoneTargetAmount = settings?.milestoneTargetAmount !== undefined && Number(settings.milestoneTargetAmount) > 0
    ? Number(settings.milestoneTargetAmount)
    : 10000;
  const milestoneDiscountAmount = settings?.milestoneDiscountAmount !== undefined && Number(settings.milestoneDiscountAmount) >= 0
    ? Number(settings.milestoneDiscountAmount)
    : 500;

  const isMilestoneUnlocked = subtotal >= milestoneTargetAmount;
  const appliedMilestoneDiscount = isMilestoneUnlocked ? milestoneDiscountAmount : 0;

  // Calculate extra VIP discount
  let extraDiscountAmount = 0;
  const maxAvailableForExtra = Math.max(0, subtotal - rankDiscountAmount - appliedMilestoneDiscount);
  if (extraDiscount > 0) {
    if (discountType === 'percent') {
      extraDiscountAmount = (subtotal * Math.min(100, extraDiscount)) / 100;
    } else {
      extraDiscountAmount = Math.min(maxAvailableForExtra, extraDiscount);
    }
  }

  const totalDiscount = rankDiscountAmount + appliedMilestoneDiscount + extraDiscountAmount;
  const totalPayable = Math.max(0, subtotal - totalDiscount);

  const isCartEmpty = cart.length === 0;

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-4 shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">Billing Subtotal & Discounts</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {cart.reduce((s, i) => s + i.quantity, 0)} items in bill
        </span>
      </div>

      {/* Breakdown Rows */}
      <div className="space-y-2 text-xs">
        {/* Gross Subtotal */}
        <div className="flex items-center justify-between text-slate-300">
          <span>Subtotal Gross Amount</span>
          <span className="font-mono font-semibold text-sm text-slate-100">
            ₹{subtotal.toFixed(2)}
          </span>
        </div>

        {/* Rank Loyalty Discount */}
        <div className="flex items-center justify-between text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-2.5 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Rank #{activeCustomer?.rank || '—'} Loyalty Discount ({rankDiscountPct}%)
            </span>
          </div>
          <span className="font-mono font-bold text-cyan-300">
            -₹{rankDiscountAmount.toFixed(2)}
          </span>
        </div>

        {/* Milestone Loyalty Reward Discount Row */}
        {isMilestoneUnlocked ? (
          <div className="flex items-center justify-between text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2.5 py-1.5 rounded-lg animate-fadeIn shadow-sm">
            <div className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="font-semibold text-slate-100">
                Milestone Cart Reward (Target ₹{milestoneTargetAmount.toLocaleString()}):
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-900 border border-purple-400 text-purple-200 font-bold uppercase tracking-wider">
                100% UNLOCKED
              </span>
            </div>
            <span className="font-mono font-bold text-purple-300">
              -₹{appliedMilestoneDiscount.toFixed(2)}
            </span>
          </div>
        ) : subtotal > 0 && subtotal < milestoneTargetAmount ? (
          <div className="flex items-center justify-between text-slate-400 bg-slate-950/40 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-[11px]">
            <div className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-purple-400" />
              <span>Milestone Perk: Add ₹{(milestoneTargetAmount - subtotal).toFixed(2)} for ₹{milestoneDiscountAmount} OFF</span>
            </div>
            <span className="font-mono text-purple-400 font-bold text-[10px]">
              {Math.min(99, Math.round((subtotal / milestoneTargetAmount) * 100))}%
            </span>
          </div>
        ) : null}

        {/* Extra / VIP Discount Input Field */}
        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Extra / VIP Cashier Discount:</span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setDiscountType('flat')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${discountType === 'flat' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                ₹
              </button>
              <button
                onClick={() => setDiscountType('percent')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${discountType === 'percent' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                %
              </button>
            </div>

            <input
              type="number"
              min="0"
              max={discountType === 'percent' ? 100 : subtotal}
              value={extraDiscount || ''}
              onChange={(e) => onUpdateExtraDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              disabled={isCartEmpty}
              className="w-20 px-2 py-1 text-right font-mono text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg text-amber-300 outline-none"
            />
            {extraDiscountAmount > 0 && (
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                (-₹{extraDiscountAmount.toFixed(2)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Gradient Box: Total Payable Amount */}
      <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 shadow-lg shadow-cyan-500/25 border border-cyan-400/40">
        <div className="flex items-center justify-between text-white">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-200" />
              Final Total Payable Amount
            </div>
            {totalDiscount > 0 && (
              <div className="text-xs text-emerald-200 font-medium mt-0.5">
                🎉 Total Customer Savings: ₹{totalDiscount.toFixed(2)}
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-white drop-shadow">
              ₹{totalPayable.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Pay Cash */}
        <button
          onClick={() => onInitiatePayment('Cash', { 
            subtotal, 
            rankDiscountAmount, 
            milestoneDiscountAmount: appliedMilestoneDiscount, 
            extraDiscountAmount, 
            totalDiscount,
            totalPayable 
          })}
          disabled={isCartEmpty}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md ${
            isCartEmpty
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 border border-emerald-400/40'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Pay Cash</span>
        </button>

        {/* Pay Online (UPI) */}
        <button
          onClick={() => onInitiatePayment('UPI', { 
            subtotal, 
            rankDiscountAmount, 
            milestoneDiscountAmount: appliedMilestoneDiscount, 
            extraDiscountAmount, 
            totalDiscount,
            totalPayable 
          })}
          disabled={isCartEmpty}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md ${
            isCartEmpty
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold shadow-cyan-500/30 border border-cyan-300'
          }`}
        >
          <QrCode className="w-4 h-4 text-slate-950" />
          <span>Pay Online (UPI)</span>
        </button>

        {/* Split (Cash+UPI) */}
        <button
          onClick={() => onInitiatePayment('Split', { 
            subtotal, 
            rankDiscountAmount, 
            milestoneDiscountAmount: appliedMilestoneDiscount, 
            extraDiscountAmount, 
            totalDiscount,
            totalPayable 
          })}
          disabled={isCartEmpty}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md ${
            isCartEmpty
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 border border-purple-400/40'
          }`}
        >
          <Split className="w-4 h-4" />
          <span>Split (Cash+UPI)</span>
        </button>
      </div>
    </div>
  );
};
