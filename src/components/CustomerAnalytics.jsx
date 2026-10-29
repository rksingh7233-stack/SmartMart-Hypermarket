import React from 'react';
import { 
  History, 
  CreditCard, 
  MoreHorizontal, 
  Gift, 
  Clock, 
  Sparkles, 
  ShoppingBag 
} from 'lucide-react';

const safeNum = (val, fallback = 0) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null) return Number(val?.amount || val?.total || fallback) || fallback;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

const safeStr = (val, fallback = '') => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object' && val !== null) return String(val?.name || val?.date || fallback);
  return fallback;
};

export const CustomerAnalytics = ({
  activeCustomer,
  cart = [],
  settings,
  onViewInvoiceModal
}) => {
  // Current active cart subtotal calculation for Present Bill Milestone
  const currentCartSubtotal = (cart || []).reduce(
    (sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)),
    0
  );

  const milestoneName = safeStr(settings?.milestoneName, "Milestone Festival Reward");
  const milestoneEnabled = settings?.milestoneEnabled !== false;

  const milestoneTargetAmount = settings?.milestoneTargetAmount !== undefined && Number(settings.milestoneTargetAmount) > 0
    ? Number(settings.milestoneTargetAmount)
    : 10000;

  const milestoneDiscountAmount = settings?.milestoneDiscountAmount !== undefined && Number(settings.milestoneDiscountAmount) >= 0
    ? Number(settings.milestoneDiscountAmount)
    : 500;

  const progressPercent = Math.min(
    100, 
    Math.round((currentCartSubtotal / milestoneTargetAmount) * 100)
  );

  const isMilestoneUnlocked = milestoneEnabled && currentCartSubtotal >= milestoneTargetAmount;
  const remainingAmount = Math.max(0, milestoneTargetAmount - currentCartSubtotal);

  const pastPurchases = Array.isArray(activeCustomer?.pastPurchases) ? activeCustomer.pastPurchases : [];

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-4 shadow-xl">
      {/* 2 Metric Mini-Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Mall Visits */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono tracking-wider">Total Mall Visits</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold font-mono text-cyan-300">
              {safeNum(activeCustomer?.visits, 0)}
            </span>
            <span className="text-[10px] text-slate-400">tracked visits</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
            <Sparkles className="w-2.5 h-2.5" /> AI Face Tracker
          </span>
        </div>

        {/* Last Buy Amount & Date */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono tracking-wider">Last Buy Amount</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold font-mono text-amber-300">
              ₹{safeNum(activeCustomer?.lastBuyAmount, 0).toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            {safeStr(activeCustomer?.lastVisitDate, "No previous visit")}
          </span>
        </div>
      </div>

      {/* Milestone Progress Bar (Calculated from Present Active Cart Subtotal) */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Gift className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate max-w-[180px]">{milestoneName}</span>
          </div>
          <span className="font-mono text-cyan-300 text-xs font-bold">
            ₹{currentCartSubtotal.toLocaleString()} / ₹{milestoneTargetAmount.toLocaleString()}
          </span>
        </div>

        {milestoneEnabled ? (
          <>
            {/* Progress Track */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isMilestoneUnlocked 
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400' 
                    : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">{progressPercent}% Completed</span>
              {currentCartSubtotal < milestoneTargetAmount ? (
                <span className="text-amber-400 font-medium font-mono">
                  ₹{remainingAmount.toLocaleString()} away from reward!
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  100% Completed - Unlocked ₹{milestoneDiscountAmount.toLocaleString()} Flat Discount!
                </span>
              )}
            </div>

            {isMilestoneUnlocked ? (
              <p className="text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 p-2 rounded-lg leading-tight font-medium flex items-center gap-1.5 animate-fadeIn">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong>{milestoneName} Active:</strong> ₹{milestoneDiscountAmount.toLocaleString()} Flat Discount automatically applied in the bill breakdown below!
                </span>
              </p>
            ) : (
              <p className="text-[10px] text-purple-300/90 bg-purple-950/30 border border-purple-500/20 p-2 rounded-lg leading-tight">
                🎁 <strong>Offer Perk:</strong> Add items worth ₹{remainingAmount.toLocaleString()} more to active cart to unlock instant ₹{milestoneDiscountAmount.toLocaleString()} off on this bill!
              </p>
            )}
          </>
        ) : (
          <p className="text-[11px] text-slate-500 font-mono py-1">
            (Festival & Milestone rewards are currently turned OFF in Settings)
          </p>
        )}
      </div>

      {/* All Previous Shopping Table with ... (3 dots) bill invoice modal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>All Previous Shopping</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {pastPurchases.length} past records
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50">
          {pastPurchases.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 space-y-1">
              <ShoppingBag className="w-5 h-5 mx-auto text-slate-600" />
              <p>No previous shopping bills for this customer.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400 bg-slate-900/60">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Invoice #</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                  <th className="py-2 px-3 text-center">Mode</th>
                  <th className="py-2 px-2 text-center w-10">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pastPurchases.map((bill, bIdx) => (
                  <tr key={safeStr(bill?.id || bill?.invoiceNo, bIdx)} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-300 text-[11px]">
                      {safeStr(bill?.date?.split(' ')[0] || bill?.date, 'Today')}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400 text-[10px]">
                      {safeStr(bill?.invoiceNo || bill?.id, 'INV')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-cyan-300">
                      ₹{safeNum(bill?.totalPaid, 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {safeStr(bill?.paymentMode, "UPI")}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => onViewInvoiceModal && onViewInvoiceModal(bill)}
                        className="w-6 h-6 inline-flex items-center justify-center rounded-lg hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30 transition-all active:scale-95"
                        title="View Detailed Invoice (3 Dots)"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
