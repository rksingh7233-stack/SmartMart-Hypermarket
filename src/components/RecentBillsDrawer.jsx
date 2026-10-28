import React, { useState } from 'react';
import { 
  X, 
  Receipt, 
  Printer, 
  MessageSquare, 
  Clock, 
  User, 
  CreditCard, 
  Banknote, 
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

export const RecentBillsDrawer = ({
  isOpen,
  onClose,
  salesHistory = [],
  settings,
  onReprint
}) => {
  const [targetPhone, setTargetPhone] = useState({});
  const [activePhoneInput, setActivePhoneInput] = useState(null);

  if (!isOpen) return null;

  // Get the last 5 transactions (newest first)
  const recentBills = [...(salesHistory || [])]
    .slice(-5)
    .reverse();

  // Generate WhatsApp message and trigger wa.me URL
  const handleSendWhatsApp = (bill) => {
    soundEngine.playScannerBeep();
    const phone = targetPhone[bill.id] || bill.customerPhone || '';
    
    const martName = settings?.martName || "SmartMart AI";
    const invoiceNo = bill.invoiceNo || bill.id || "BILL-REF";
    const dateStr = bill.date ? new Date(bill.date).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
    const customer = bill.customerName || "Valued Customer";
    
    const itemsList = (bill.items || []).map(
      (item, idx) => `${idx + 1}. ${item.name} x${item.qty} = ₹${(item.total || item.qty * item.price).toFixed(2)}`
    ).join('\n');

    const message = 
`🧾 *TAX INVOICE - ${martName.toUpperCase()}*
============================
*Invoice No:* ${invoiceNo}
*Date:* ${dateStr}
*Customer:* ${customer}
============================
*ITEMS PURCHASED:*
${itemsList}
============================
*Subtotal:* ₹${(bill.subtotal || bill.totalPaid || 0).toFixed(2)}
*Discount Applied:* ₹${(bill.discount || 0).toFixed(2)}
*TOTAL PAID:* ₹${(bill.totalPaid || 0).toFixed(2)}
*Payment Mode:* ${bill.paymentMode || 'UPI'}
============================
Thank you for shopping at ${martName}!
For support: ${settings?.helpline || settings?.phone || '+91 98765 43210'}`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (cleanPhone.length >= 10) {
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
    } else {
      // If no valid phone number is entered, prompt user or open web whatsapp
      const userPhone = window.prompt("Enter customer 10-digit mobile number for WhatsApp:", cleanPhone);
      if (userPhone) {
        const cleaned = userPhone.replace(/[^0-9]/g, '');
        const finalPhone = cleaned.length === 10 ? `91${cleaned}` : cleaned;
        window.open(`https://wa.me/${finalPhone}?text=${encoded}`, '_blank');
      }
    }
  };

  const handleReprintClick = (bill) => {
    soundEngine.playCashDrawerDing();
    onReprint(bill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0c1222] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  🧾 Recent 5 Bills (Cashier Quick Helper)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold">
                  Last 5 Transactions
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Quickly re-print thermal slips or resend invoice receipts directly to customer WhatsApp
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

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {recentBills.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Receipt className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">No Recent Bills Found</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Completed customer billing transactions from today will show up here for fast 1-click re-printing.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {recentBills.map((bill, index) => {
                const billDate = bill.date ? new Date(bill.date) : new Date();
                const timeString = billDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });
                const dateString = billDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short'
                });

                return (
                  <div 
                    key={bill.id || index}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3"
                  >
                    {/* Top Row: Invoice ID, Date, Amount */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-300 text-sm">
                          {bill.invoiceNo || bill.id}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {dateString}, {timeString}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-1">
                          {bill.paymentMode === 'Cash' ? (
                            <Banknote className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <CreditCard className="w-3 h-3 text-cyan-400" />
                          )}
                          {bill.paymentMode || 'UPI'}
                        </span>
                        <span className="text-base font-extrabold text-emerald-400 font-mono">
                          ₹{(bill.totalPaid || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Customer Info & Items summary */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-200">
                          {bill.customerName || "Walk-in Guest"}
                        </span>
                        {bill.customerPhone && (
                          <span className="text-slate-500 font-mono text-[11px]">
                            ({bill.customerPhone})
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {bill.itemsCount || (bill.items ? bill.items.length : 1)} item(s) purchased
                      </div>
                    </div>

                    {/* Items chips */}
                    {bill.items && bill.items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {bill.items.slice(0, 4).map((it, i) => (
                          <span 
                            key={i} 
                            className="px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400"
                          >
                            {it.name} <strong className="text-slate-300">x{it.qty}</strong>
                          </span>
                        ))}
                        {bill.items.length > 4 && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-[10px] text-slate-500">
                            +{bill.items.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons: Side-by-side Re-Print & WhatsApp */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                      <button
                        onClick={() => handleReprintClick(bill)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all active:scale-95 shadow-sm"
                        title="Open thermal receipt print preview"
                      >
                        <Printer className="w-3.5 h-3.5 text-cyan-400" />
                        <span>🖨️ Re-Print Slip</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsApp(bill)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-md shadow-emerald-600/20"
                        title="Send digital receipt directly to customer's WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
                        <span>💬 Send on WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
