import React from 'react';
import { X, Receipt, Calendar, CreditCard, Printer, ArrowLeft } from 'lucide-react';
import { getSettings } from '../services/storage';

export const InvoiceModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const settings = getSettings();
  const festivalOfferName = invoice.milestoneName || settings?.milestoneName || "Milestone Festival Discount";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2 text-cyan-400">
            <Receipt className="w-5 h-5" />
            <h3 className="font-bold text-slate-100 text-sm">Historical Bill Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs">
          {/* Metadata */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Invoice Number:</span>
              <span className="font-bold text-cyan-300">{invoice.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Transaction Date:</span>
              <span className="text-slate-200">{invoice.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Settlement Mode:</span>
              <span className="text-emerald-400 font-bold uppercase">{invoice.paymentMode || "UPI"}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 text-[10px] uppercase">
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">Price</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-slate-200 truncate max-w-[140px] font-sans font-medium">
                      {item.name}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-400">{item.qty || item.quantity}</td>
                    <td className="py-2 px-2 text-right text-slate-400">₹{item.price}</td>
                    <td className="py-2 px-3 text-right font-bold text-cyan-300">
                      ₹{((item.qty || item.quantity) * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Gross Subtotal:</span>
              <span className="text-slate-200 font-bold">₹{invoice.subtotal?.toFixed(2)}</span>
            </div>

            {invoice.rankDiscountAmount > 0 && (
              <div className="flex justify-between text-cyan-400">
                <span>Rank Loyalty Discount ({invoice.rankDiscountPct}%):</span>
                <span>-₹{invoice.rankDiscountAmount?.toFixed(2)}</span>
              </div>
            )}

            {invoice.milestoneDiscountAmount > 0 && (
              <div className="flex justify-between text-purple-400">
                <span>{festivalOfferName}:</span>
                <span>-₹{invoice.milestoneDiscountAmount?.toFixed(2)}</span>
              </div>
            )}

            {invoice.extraDiscountAmount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>VIP Discount:</span>
                <span>-₹{invoice.extraDiscountAmount?.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>Total Paid:</span>
              <span className="text-cyan-400 font-mono text-base">₹{invoice.totalPaid?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Prominent Back to POS Button at Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>⬅ Back to POS / New Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
