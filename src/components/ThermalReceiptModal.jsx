import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Send, 
  Scissors, 
  Check, 
  Sparkles, 
  ArrowLeft, 
  Store, 
  QrCode, 
  Share2,
  Receipt
} from 'lucide-react';
import QRCode from 'qrcode';
import { soundEngine } from '../services/audioService';

export const ThermalReceiptModal = ({
  transaction,
  cart = [],
  activeCustomer,
  settings,
  onClose
}) => {
  const [receiptQrUrl, setReceiptQrUrl] = useState('');
  const [isTorn, setIsTorn] = useState(false);
  const [showWhatsAppToast, setShowWhatsAppToast] = useState(false);

  // Generate NPCI / Verification QR on mount
  useEffect(() => {
    soundEngine.playCashDrawerDing();

    const invoicePayload = JSON.stringify({
      inv: transaction?.invoiceNo,
      date: transaction?.date,
      total: transaction?.totalPaid,
      itemsCount: cart.length,
      store: settings?.martName,
      status: 'VERIFIED_TAX_INVOICE'
    });

    QRCode.toDataURL(invoicePayload, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
    .then(url => setReceiptQrUrl(url))
    .catch(err => console.error(err));
  }, [transaction, cart, settings]);

  const handlePrint = () => {
    soundEngine.playScannerBeep();
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${transaction?.invoiceNo}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 76mm;
              margin: 0 auto;
              padding: 4mm 2mm;
              font-size: 11px;
              line-height: 1.35;
              color: #000;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-b-dashed { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .border-t-dashed { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
            th, td { padding: 2px 0; }
            .qr-box { text-align: center; margin: 8px 0; }
            .qr-box img { width: 100px; height: 100px; }
          </style>
        </head>
        <body>
          <div class="text-center border-b-dashed">
            <div style="font-size: 16px; font-weight: bold;">${settings?.martName || 'SmartMart AI'}</div>
            <div>${settings?.shopAddress || 'Autonomous Express Mall, Tech Zone'}</div>
            <div>Phone: ${settings?.helpline || '+91 98765 43210'}</div>
            <div>GSTIN: ${settings?.gstin || '07AAAAA0000A1Z5'}</div>
          </div>

          <div class="border-b-dashed" style="font-size: 10px;">
            <div>Invoice: <strong>${transaction?.invoiceNo}</strong></div>
            <div>Date: ${transaction?.date} | Counter: ${settings?.counterId || '01'}</div>
            <div>Customer: ${activeCustomer?.name || 'Walk-in Guest'} (${activeCustomer?.id || 'GUEST'})</div>
            <div>Loyalty Rank: #${activeCustomer?.rank || 1}</div>
          </div>

          <div class="border-b-dashed">
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Item</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Total</th>
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
                <span>${festivalOfferName}:</span>
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
            ${receiptQrUrl ? `<img src="${receiptQrUrl}" alt="Verify" />` : ''}
            <div style="font-size: 9px; margin-top: 4px; color: #555;">Scan to verify digital tax invoice</div>
          </div>

          <div class="text-center" style="margin-top: 12px; font-size: 9px; color: #666;">
            *** THANK YOU FOR SHOPPING! ***<br>
            Powered by SmartMart AI POS
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 350);
    }
  };

  const handleWhatsAppSend = () => {
    soundEngine.playScannerBeep();
    setShowWhatsAppToast(true);

    const cleanPhone = (activeCustomer?.mobile || '').replace(/\D/g, '');
    const shopName = settings?.martName || "SmartMart AI";
    const amount = (transaction?.totalPaid || 0).toFixed(2);
    const invoiceNo = transaction?.invoiceNo || `INV-${Date.now().toString().slice(-6)}`;
    const custName = activeCustomer?.name || "Customer";
    
    const textMsg = `*${shopName} — Digital Bill Receipt*\n` +
      `Hello ${custName},\n` +
      `Invoice: ${invoiceNo}\n` +
      `Total Paid: ₹${amount} (${transaction?.paymentMode?.toUpperCase() || 'PAID'})\n` +
      `Thank you for shopping with us!`;

    if (cleanPhone && cleanPhone.length >= 10) {
      const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(textMsg)}`;
      window.open(waUrl, '_blank');
    }

    setTimeout(() => {
      setShowWhatsAppToast(false);
    }, 4000);
  };

  const handleTear = () => {
    soundEngine.playScannerBeep();
    setIsTorn(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const festivalOfferName = settings?.milestoneName || "Festival Offer Discount";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative flex flex-col items-center max-w-md w-full">
        {/* Back to POS / New Bill Button */}
        <div className="w-full flex items-center justify-between mb-3 px-1">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>⬅ Back to POS / New Bill</span>
          </button>

          <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            ✓ Bill Finalized
          </span>
        </div>

        {/* Paper Thermal Receipt Container */}
        <div 
          className={`w-full max-w-sm bg-white text-slate-900 p-6 rounded-t-2xl shadow-2xl font-mono text-xs border border-slate-300 transition-all duration-500 ${
            isTorn ? 'translate-y-96 opacity-0 rotate-6' : 'animate-receipt-roll'
          }`}
        >
          {/* Store Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-0.5">
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              {settings?.martName || "SmartMart AI"}
            </h2>
            <p className="text-[10px] text-slate-600">
              {settings?.shopAddress || "Autonomous Express Mall, Tech Zone"}
            </p>
            <p className="text-[10px] text-slate-600">
              Helpline: {settings?.helpline || "+91 98765 43210"}
            </p>
            <p className="text-[9px] text-slate-500 font-bold">
              GSTIN: {settings?.gstin || "07AAAAA0000A1Z5"}
            </p>
          </div>

          {/* Invoice Metadata */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[10px] space-y-0.5 text-slate-700">
            <div className="flex justify-between">
              <span>Invoice No:</span>
              <span className="font-bold text-slate-950">{transaction?.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{transaction?.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier / Counter:</span>
              <span>{settings?.cashierName || "Aakash"} (TERMINAL-01)</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span>Customer:</span>
              <span className="font-bold text-slate-950">
                {activeCustomer?.name || "Walk-in Guest"}
              </span>
            </div>
            <div className="flex justify-between text-[9px] text-slate-600">
              <span>Customer ID / Rank:</span>
              <span>{activeCustomer?.id || "GUEST"} • Rank #{activeCustomer?.rank || 1}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-400">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-slate-300 font-bold text-slate-800">
                  <th className="pb-1">Item</th>
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Price</th>
                  <th className="pb-1 text-right">Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((item, idx) => (
                  <tr key={idx} className="py-0.5">
                    <td className="py-1 font-semibold text-slate-900 truncate max-w-[120px]">
                      {item.name}
                    </td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">₹{item.price}</td>
                    <td className="py-1 text-right font-bold">
                      ₹{(item.quantity * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-700">
              <span>Gross Subtotal:</span>
              <span>₹{(transaction?.subtotal || 0).toFixed(2)}</span>
            </div>

            {transaction?.rankDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Rank Loyalty Discount:</span>
                <span>-₹{(transaction.rankDiscountAmount).toFixed(2)}</span>
              </div>
            )}

            {transaction?.milestoneDiscountAmount > 0 && (
              <div className="flex justify-between text-purple-700">
                <span>{festivalOfferName}:</span>
                <span>-₹{(transaction.milestoneDiscountAmount).toFixed(2)}</span>
              </div>
            )}

            {transaction?.extraDiscountAmount > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>Cashier VIP Discount:</span>
                <span>-₹{(transaction.extraDiscountAmount).toFixed(2)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-400 flex justify-between items-center text-sm font-black text-slate-950">
              <span>TOTAL PAID:</span>
              <span className="text-base font-extrabold">₹{(transaction?.totalPaid || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-600 pt-0.5">
              <span>Payment Mode:</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                {transaction?.paymentMode?.toUpperCase() || 'UPI'}
              </span>
            </div>
          </div>

          {/* Verification QR */}
          <div className="pt-3 pb-1 flex flex-col items-center justify-center">
            {receiptQrUrl && (
              <img src={receiptQrUrl} alt="Verify Invoice" className="w-24 h-24 object-contain mix-blend-multiply" />
            )}
            <span className="text-[8px] text-slate-500 mt-1 uppercase font-mono">
              Scan to verify digital invoice
            </span>
          </div>

          {/* Jagged / Tear Bottom Edge */}
          <div className="mt-4 pt-2 text-center text-[9px] text-slate-500 uppercase border-t border-dotted border-slate-400">
            *** THANK YOU FOR SHOPPING! ***
          </div>
        </div>

        {/* Dual Side-by-Side Action Controls Beneath Receipt */}
        <div className="w-full mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* 🖨️ Print Receipt */}
            <button
              onClick={handlePrint}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Print Receipt</span>
            </button>

            {/* 💬 Send on WhatsApp */}
            <button
              onClick={handleWhatsAppSend}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>💬 Send on WhatsApp</span>
            </button>
          </div>

          {/* Tear & Next Bill */}
          <button
            onClick={handleTear}
            className="w-full py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-slate-700/80 transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Tear & Next Bill</span>
          </button>
        </div>

        {/* WhatsApp Simulation Toast */}
        {showWhatsAppToast && (
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-semibold animate-fadeIn flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>Digital e-Invoice dispatched to {activeCustomer?.mobile || 'customer WhatsApp'}!</span>
          </div>
        )}
      </div>
    </div>
  );
};
