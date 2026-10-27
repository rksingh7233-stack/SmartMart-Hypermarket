import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Boxes, 
  ArrowRight,
  Trash2,
  Sparkles
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

export const BulkImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Download Sample CSV template
  const handleDownloadTemplate = () => {
    const csvContent = 
`Item Name,Price,Stock,Category,Barcode
Basmati Royal Biryani Rice (5kg),620,30,Grocery & Staples,890103001
Organic Cold Pressed Mustard Oil (1L),180,45,Grocery & Staples,890103002
Tata Sampann Unpolished Toor Dal (1kg),165,35,Grocery & Staples,890103003
Cadbury Bournvita Chocolate Health Drink (500g),245,20,Beverages,890103004
Amul Garlic Butter (200g),115,25,Dairy & Daily Essentials,890103005
Dabur Red Ayurvedic Toothpaste (300g),135,40,Personal Care & Cleaning,890103006
Britannia Good Day Cashew Cookies (200g),45,60,Snacks & Chocolates,890103007`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'smartmart_inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simple, robust CSV / TSV parser
  const parseCSVText = (text) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error("CSV file must contain a header row and at least one item row.");
    }

    // Parse header row
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    // Map column indices
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('item') || h.includes('product'));
    const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('rate') || h.includes('mrp') || h.includes('cost'));
    const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('qty') || h.includes('quantity') || h.includes('count'));
    const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('type') || h.includes('dept'));
    const barcodeIdx = headers.findIndex(h => h.includes('barcode') || h.includes('code') || h.includes('sku') || h.includes('upc'));

    if (nameIdx === -1 || priceIdx === -1) {
      throw new Error("CSV must include at least 'Item Name' and 'Price' columns.");
    }

    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;

      // Handle commas inside quotes or standard split
      let row = [];
      let inQuotes = false;
      let curVal = '';
      for (let ch of rawLine) {
        if (ch === '"' || ch === "'") {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          row.push(curVal.trim());
          curVal = '';
        } else {
          curVal += ch;
        }
      }
      row.push(curVal.trim());

      const rawName = row[nameIdx]?.replace(/['"]/g, '').trim();
      const rawPrice = parseFloat(row[priceIdx]?.replace(/[^0-9.]/g, ''));
      const rawStock = stockIdx !== -1 ? parseInt(row[stockIdx]?.replace(/[^0-9]/g, ''), 10) : 20;
      const rawCategory = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].replace(/['"]/g, '').trim() : 'Grocery & Staples';
      const rawBarcode = barcodeIdx !== -1 && row[barcodeIdx] ? row[barcodeIdx].replace(/['"]/g, '').trim() : `890${Math.floor(100000000 + Math.random() * 900000000)}`;

      if (rawName && !isNaN(rawPrice) && rawPrice > 0) {
        items.push({
          id: `PROD-${Date.now().toString().slice(-4)}-${i}`,
          name: rawName,
          price: rawPrice,
          stock: !isNaN(rawStock) && rawStock >= 0 ? rawStock : 15,
          category: rawCategory || 'Grocery & Staples',
          barcode: rawBarcode,
          unit: '1 unit'
        });
      }
    }

    return items;
  };

  const handleFileProcess = (selectedFile) => {
    if (!selectedFile) return;
    setErrorMsg('');
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseCSVText(text);
        if (parsed.length === 0) {
          setErrorMsg("No valid product rows could be extracted from this file.");
        } else {
          setParsedItems(parsed);
          soundEngine.playScannerBeep();
        }
      } catch (err) {
        setErrorMsg(err.message || "Failed to parse file. Please verify CSV formatting.");
        soundEngine.playErrorBuzz();
      }
    };
    reader.onerror = () => {
      setErrorMsg("Error reading file.");
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileProcess(droppedFile);
    }
  };

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;
    soundEngine.playCashDrawerDing();
    onImportSuccess(parsedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0c1222] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Bulk Item Import (CSV / Excel)</h3>
              <p className="text-xs text-slate-400">Import old inventory, barcode prices, and stocks in one click</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold"
              title="Download sample CSV template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          {parsedItems.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-cyan-400 bg-cyan-950/30' 
                  : 'border-slate-700 hover:border-cyan-500/60 bg-slate-950/50 hover:bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .txt, .xlsx, .xls"
                className="hidden"
                onChange={(e) => handleFileProcess(e.target.files?.[0])}
              />
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Drag & Drop CSV / Excel File here, or click to browse
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-3">
                File must include columns: <strong>Item Name</strong>, <strong>Price</strong>, <strong>Stock</strong>, and <strong>Category</strong>.
              </p>
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 font-semibold">
                Supports .CSV and standard spreadsheet exports
              </span>
            </div>
          ) : (
            /* Parsed Items Preview Table */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">
                    {parsedItems.length} Items Ready to Import from:
                  </span>
                  <span className="text-cyan-400 font-mono text-[11px] truncate max-w-xs">
                    {file?.name}
                  </span>
                </div>
                <button
                  onClick={() => { setFile(null); setParsedItems([]); }}
                  className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70 max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Price (₹)</th>
                      <th className="py-2 px-3 text-right">Stock</th>
                      <th className="py-2 px-3">Barcode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-semibold text-slate-200 font-sans">{item.name}</td>
                        <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{item.category}</td>
                        <td className="py-2 px-3 text-right font-bold text-cyan-300">₹{item.price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-bold">{item.stock}</td>
                        <td className="py-2 px-3 text-slate-500 text-[10px]">{item.barcode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedItems.length > 0 && (
          <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Total {parsedItems.length} products to be merged into catalog
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                <Boxes className="w-4 h-4 text-slate-950" />
                <span>Confirm & Add All to Catalog</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
