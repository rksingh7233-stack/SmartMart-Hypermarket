import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Scissors, 
  RotateCcw, 
  Check, 
  Send, 
  ArrowLeft,
  Receipt
} from 'lucide-react';
import QRCode from 'qrcode';
import { soundEngine } from '../services/audioService';

export const ThermalReceiptModal = ({
  transaction,
  cart,
  activeCustomer,
  settings,
  onClose
}) => {
  const [receiptQrUrl, setReceiptQrUrl] = useState('');
  const [isTorn, setIsTorn] = useState(false);
  const [showWhatsAppToast, setShowWhatsAppToast] = useState(false);

  useEffect(() => {
    // Play thermal printer ratchet audio upon mount!
    soundEngine.playPrinterRollSound();

    // Generate digital receipt verification QR
    const verifyPayload = JSON.stringify({
      mart: settings?.martName || "SmartMart Hypermarket",
      invoice: transaction?.invoiceNo,
      total: transaction?.totalPaid,
      customer: activeCustomer?.name || "Customer",
      verified: true
    });

    QRCode.toDataURL(verifyPayload, {
      width: 140,
      margin: 1,
      color: { dark: '#111827', light: '#fdfbf7' }
    })
    .then(url => setReceiptQrUrl(url))
    .catch(err => console.error(err));
  }, [settings, transaction, activeCustomer]);

  // Working Dedicated Print Window Fix: Opens isolated clean print window to prevent blank pages!
  const handlePrint = () => {
    soundEngine.playPrinterRollSound();

    const slipElement = document.getElementById('thermal-paper-slip');
    if (!slipElement) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=420,height=750');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${transaction?.invoiceNo || 'Print'}</title>
          <style>
            @page {
              margin: 0;
              size: 80mm auto;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              margin: 0;
              padding: 10px 14px;
              width: 72mm;
              background: #fff;
              line-height: 1.35;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-b-dashed { border-bottom: 1px dashed #333; padding-bottom: 6px; margin-bottom: 6px; }
            .border-t-dashed { border-top: 1px dashed #333; padding-top: 6px; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid #333; font-size: 10px; }
            td { padding: 2px 0; }
            .qr-box { text-align: center; margin-top: 10px; }
            .qr-box img { width: 110px; height: 110px; }
          </style>
        </head>
        <body>
          <div class="text-center border-b-dashed">
            <h2 style="margin: 0; font-size: 15px; font-weight: bold;">${settings?.martName || "SmartMart Hypermarket"}</h2>
            <div style="font-size: 10px; color: #555;">${settings?.tagline || "Autonomous Retail Terminal"}</div>
            <div style="font-size: 9px; color: #666;">GSTIN: ${settings?.gstin || "29AAECS1234F1Z8"}</div>
            <div style="font-size: 9px; color: #666;">Helpline: ${settings?.helpline || "+91 80 4961 8888"}</div>
          </div>

          <div class="border-b-dashed" style="font-size: 10px;">
            <div><strong>INVOICE #:</strong> ${transaction?.invoiceNo}</div>
            <div><strong>DATE/TIME:</strong> ${transaction?.date}</div>
            <div><strong>TERMINAL:</strong> ${settings?.counterId || "TERMINAL-04"}</div>
            <div><strong>CUSTOMER:</strong> ${activeCustomer?.name || "Walk-in Guest"} (${activeCustomer?.id || "GUEST"})</div>
            <div><strong>LOYALTY RANK:</strong> Rank #${activeCustomer?.rank || "—"}</div>
          </div>

          <div class="border-b-dashed">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Amt</th>
                </tr>
              </thead>
              <tbody>
                ${cart.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">₹${item.price}</td>
                    <td class="text-right font-bold">₹${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="border-b-dashed">
            <div style="display: flex; justify-content: space-between;">
              <span>Subtotal:</span>
              <span>₹${transaction?.subtotal?.toFixed(2)}</span>
            </div>
            ${transaction?.rankDiscountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Rank VIP Discount:</span>
                <span>-₹${transaction?.rankDiscountAmount?.toFixed(2)}</span>
              </div>
            ` : ''}
            ${transaction?.milestoneDiscountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Milestone Reward:</span>
                <span>-₹${transaction?.milestoneDiscountAmount?.toFixed(2)}</span>
              </div>
            ` : ''}
            ${transaction?.extraDiscountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Special Cashier VIP:</span>
                <span>-₹${transaction?.extraDiscountAmount?.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="border-t-dashed" style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold;">
              <span>TOTAL PAID:</span>
              <span>₹${transaction?.totalPaid?.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 3px;">
              <span>PAYMENT MODE:</span>
              <span>${transaction?.paymentMode?.toUpperCase()}</span>
            </div>
          </div>

          <div class="qr-box">
            ${receiptQrUrl ? `<img src="${receiptQrUrl}" />` : ''}
            <div style="font-size: 8px; margin-top: 3px; letter-spacing: 1px;">SCAN TO VERIFY e-INVOICE</div>
            <div style="font-size: 9px; font-weight: bold; margin-top: 5px;">*** THANK YOU FOR SHOPPING! ***</div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    } else {
      window.print();
    }
  };

  const handleReprint = () => {
    soundEngine.playPrinterRollSound();
    const el = document.getElementById('thermal-paper-slip');
    if (el) {
      el.classList.remove('animate-receipt-roll');
      void el.offsetWidth;
      el.classList.add('animate-receipt-roll');
    }
  };

  const handleTear = () => {
    soundEngine.playScannerBeep();
    setIsTorn(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleSendWhatsApp = () => {
    soundEngine.playScannerBeep();
    setShowWhatsAppToast(true);

    const cleanMobile = activeCustomer?.mobile?.replace(/[^0-9]/g, '') || '919876543210';
    const text = `🧾 *${settings?.martName || "SmartMart Hypermarket"}*
Invoice: *${transaction?.invoiceNo}*
Date: ${transaction?.date}
Customer: ${activeCustomer?.name || "Customer"} (Rank #${activeCustomer?.rank || "—"})
Items: ${cart.length} items
Total Paid: *₹${transaction?.totalPaid?.toFixed(2)}* (${transaction?.paymentMode})
Thank you for shopping with us! Visit again.`;

    const waUrl = `https://wa.me/${cleanMobile}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');

    setTimeout(() => setShowWhatsAppToast(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-sm flex flex-col items-center my-6">
        
        {/* Prominent Back to POS / New Bill Button at Top */}
        <button
          onClick={onClose}
          className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/30 transition-all active:scale-95 z-30"
          title="Return to POS and start fresh bill"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>⬅ Back to POS / New Bill</span>
        </button>

        {/* Golden/Cream Roller Graphic at top */}
        <div className="relative w-64 h-6 rounded-full bg-gradient-to-r from-amber-600 via-amber-200 to-amber-700 shadow-xl border border-amber-400/50 flex items-center justify-center z-20">
          <div className="w-56 h-1.5 bg-black/40 rounded-full shadow-inner" />
        </div>

        {/* The Rolling Thermal Paper */}
        <div 
          id="thermal-paper-slip"
          className={`w-full thermal-paper rounded-b-sm p-6 shadow-2xl animate-receipt-roll transition-all duration-500 font-mono text-[11px] text-slate-900 border-x border-slate-300 ${
            isTorn ? 'translate-y-24 opacity-0 rotate-2' : ''
          }`}
          style={{ width: '320px' }}
        >
          {/* Header */}
          <div className="border-b border-dashed border-slate-400 pb-3 text-center space-y-0.5">
            <h2 className="text-base font-black tracking-tight uppercase text-slate-900">
              {settings?.martName || "SmartMart Hypermarket"}
            </h2>
            <p className="text-[10px] text-slate-600">{settings?.tagline || "Autonomous Retail Terminal"}</p>
            <p className="text-[9px] text-slate-500 font-sans">GSTIN: {settings?.gstin || "29AAECS1234F1Z8"}</p>
            <p className="text-[9px] text-slate-500 font-sans">Helpline: {settings?.helpline || "+91 80 4961 8888"}</p>
          </div>

          {/* Bill Meta */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>INVOICE #:</span>
              <strong className="font-bold">{transaction?.invoiceNo}</strong>
            </div>
            <div className="flex justify-between">
              <span>DATE/TIME:</span>
              <span>{transaction?.date}</span>
            </div>
            <div className="flex justify-between">
              <span>TERMINAL:</span>
              <span>{settings?.counterId || "TERMINAL-04"}</span>
            </div>
            <div className="flex justify-between">
              <span>CUSTOMER:</span>
              <span className="font-bold">{activeCustomer?.name || "Guest Customer"} ({activeCustomer?.id || "GUEST"})</span>
            </div>
            <div className="flex justify-between">
              <span>LOYALTY RANK:</span>
              <span className="font-bold text-amber-700">Rank #{activeCustomer?.rank || "—"}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2 border-b border-dashed border-slate-400">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-400 text-[9px] uppercase font-bold">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Rate</th>
                  <th className="py-1 text-right">Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dotted divide-slate-300">
                {cart.map((item, idx) => (
                  <tr key={idx} className="leading-tight">
                    <td className="py-1 pr-1 truncate max-w-[120px] font-sans font-medium text-[10px]">
                      {item.name}
                    </td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">₹{item.price}</td>
                    <td className="py-1 text-right font-bold">₹{(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Savings */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-700">
              <span>Gross Subtotal:</span>
              <span>₹{transaction?.subtotal?.toFixed(2)}</span>
            </div>

            {transaction?.rankDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>Rank VIP Discount:</span>
                <span>-₹{transaction?.rankDiscountAmount?.toFixed(2)}</span>
              </div>
            )}

            {transaction?.milestoneDiscountAmount > 0 && (
              <div className="flex justify-between text-purple-800 font-semibold">
                <span>Milestone Reward:</span>
                <span>-₹{transaction?.milestoneDiscountAmount?.toFixed(2)}</span>
              </div>
            )}

            {transaction?.extraDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>Special Cashier VIP:</span>
                <span>-₹{transaction?.extraDiscountAmount?.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-1.5 border-t border-slate-400 flex justify-between text-sm font-black text-slate-950">
              <span>TOTAL PAID:</span>
              <span>₹{transaction?.totalPaid?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
              <span>PAYMENT MODE:</span>
              <strong className="uppercase">{transaction?.paymentMode}</strong>
            </div>

            {transaction?.changeReturned > 0 && (
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>CHANGE RETURNED:</span>
                <span>₹{transaction?.changeReturned?.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Verification QR Code */}
          <div className="pt-3 pb-1 flex flex-col items-center text-center space-y-1">
            {receiptQrUrl && (
              <img src={receiptQrUrl} alt="Verify Receipt" className="w-20 h-20 border border-slate-300 p-0.5 bg-white" />
            )}
            <span className="text-[8px] font-sans text-slate-500 uppercase tracking-widest">
              Scan to Verify e-Invoice
            </span>
            <p className="text-[9px] text-slate-700 font-bold pt-1">
              *** THANK YOU FOR SHOPPING! ***
            </p>
          </div>

          {/* Zig-Zag Thermal Paper Cut Bottom */}
          <div className="thermal-paper-jagged-bottom mt-2" />
        </div>

        {/* Floating Action Buttons */}
        <div className="w-full flex flex-wrap items-center justify-center gap-2 mt-5 z-20">
          {/* Working Print Receipt Fix */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-lg transition-all active:scale-95 border border-slate-600"
            title="Open dedicated print window"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print Receipt</span>
          </button>

          {/* Re-Print */}
          <button
            onClick={handleReprint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-lg transition-all active:scale-95 border border-slate-600"
            title="Re-run thermal roller"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Re-print</span>
          </button>

          {/* Send Bill (WhatsApp) */}
          <button
            onClick={handleSendWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            title="Send digital receipt to customer's WhatsApp"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Bill</span>
          </button>

          {/* Tear Receipt & Start New Bill */}
          <button
            onClick={handleTear}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
            title="Tear receipt and start next customer"
          >
            <Scissors className="w-4 h-4 text-slate-950" />
            <span>Tear & Next</span>
          </button>
        </div>

        {/* WhatsApp notification toast */}
        {showWhatsAppToast && (
          <div className="mt-3 text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xl animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp e-Bill sent to {activeCustomer?.mobile || "Customer"}!</span>
          </div>
        )}
      </div>
    </div>
  );
};
