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

    const festivalOfferName = settings?.milestoneName || "Milestone Festival Discount";

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
            ${settings?.shopAddress ? `<div style="font-size: 9px; color: #444; margin: 2px 0;">${settings.shopAddress}</div>` : ''}
            <div style="font-size: 10px; color: #555;">${settings?.tagline || "Autonomous Retail Terminal"}</div>
            <div style="font-size: 9px; color: #666;">GSTIN: ${settings?.gstin || "29AAECS1234F1Z8"}</div>
            <div style="font-size: 9px; color: #666;">Helpline: ${settings?.helpline || "+91 80 4961 8888"}</div>
          </div>

          <div class="border-b-dashed" style="font-size: 10px;">
            <div><strong>INVOICE #:</strong> ${transaction?.invoiceNo}</div>
            <div><strong>DATE/TIME:</strong> ${transaction?.date}</div>
            <div><strong>TERMINAL:</strong> ${settings?.counterId || "TERMINAL-04"}</div>
            <div><strong>CUSTOMER:</strong> ${activeCustomer?.name || "Walk-in Guest"} (${activeCustomer?.id || "GUEST"})</div>
            ${settings?.rankSystemEnabled !== false ? `<div><strong>LOYALTY RANK:</strong> Rank #${activeCustomer?.rank || "—"}</div>` : ''}
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
            Powered by SmartMart AI Engine
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
    setTimeout(() => {
      setShowWhatsAppToast(false);
    }, 3500);
  };

  const handleTear = () => {
    soundEngine.playScannerBeep();
    setIsTorn(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const festivalOfferName = settings?.milestoneName || "Milestone Festival Discount";

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

        {/* The Roller Mechanism Graphic */}
        <div className="w-72 h-7 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-900 rounded-t-xl border-t-2 border-x-2 border-amber-400/80 shadow-2xl relative flex items-center justify-center">
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
            {settings?.shopAddress && (
              <p className="text-[9px] text-slate-600 font-sans leading-tight">
                {settings.shopAddress}
              </p>
            )}
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
            {settings?.rankSystemEnabled !== false && (
              <div className="flex justify-between">
                <span>LOYALTY RANK:</span>
                <span className="font-bold text-amber-700">Rank #{activeCustomer?.rank || "—"}</span>
              </div>
            )}
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
                <span>{festivalOfferName}:</span>
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

        {/* Action Controls Beneath Receipt */}
        <div className="w-full mt-4 flex flex-wrap items-center justify-center gap-2">
          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          {/* Send via WhatsApp */}
          <button
            onClick={handleWhatsAppSend}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-700/30 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Send Bill (WhatsApp)</span>
          </button>

          {/* Tear & Next Bill */}
          <button
            onClick={handleTear}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all active:scale-95"
          >
            <Scissors className="w-4 h-4 text-amber-400" />
            <span>Tear & Next</span>
          </button>
        </div>

        {/* WhatsApp Simulation Toast */}
        {showWhatsAppToast && (
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-semibold animate-fadeIn flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>Digital e-Invoice dispatched to {activeCustomer?.mobile || 'customer mobile'}!</span>
          </div>
        )}
      </div>
    </div>
  );
};
