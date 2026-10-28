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
  Sparkles,
  FileText,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { soundEngine } from '../services/audioService';

export const BulkImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Sample data for template download
  const sampleData = [
    { name: "Basmati Royal Biryani Rice (5kg)", category: "Grocery & Staples", costPrice: 480, price: 620, stock: 30, barcode: "890103001" },
    { name: "Organic Cold Pressed Mustard Oil (1L)", category: "Grocery & Staples", costPrice: 135, price: 180, stock: 45, barcode: "890103002" },
    { name: "Tata Sampann Unpolished Toor Dal (1kg)", category: "Grocery & Staples", costPrice: 125, price: 165, stock: 35, barcode: "890103003" },
    { name: "Cadbury Bournvita Health Drink (500g)", category: "Beverages", costPrice: 195, price: 245, stock: 20, barcode: "890103004" },
    { name: "Amul Garlic Butter (200g)", category: "Dairy & Daily Essentials", costPrice: 90, price: 115, stock: 25, barcode: "890103005" },
    { name: "Dabur Red Ayurvedic Toothpaste (300g)", category: "Personal Care & Cleaning", costPrice: 105, price: 135, stock: 40, barcode: "890103006" },
    { name: "Britannia Good Day Cashew Cookies (200g)", category: "Snacks & Chocolates", costPrice: 32, price: 45, stock: 60, barcode: "890103007" }
  ];

  // Download Sample CSV template
  const handleDownloadCsvTemplate = () => {
    soundEngine.playScannerBeep();
    const headers = ["Item Name", "Category", "Cost Price", "Selling Price", "Stock", "Barcode"];
    const rows = sampleData.map(d => 
      `"${d.name}","${d.category}",${d.costPrice},${d.price},${d.stock},"${d.barcode}"`
    );
    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'smartmart_product_catalog_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample Excel (.xlsx) template
  const handleDownloadExcelTemplate = () => {
    soundEngine.playScannerBeep();
    const worksheetData = [
      ["Item Name", "Category", "Cost Price", "Selling Price", "Stock", "Barcode"],
      ...sampleData.map(d => [d.name, d.category, d.costPrice, d.price, d.stock, d.barcode])
    ];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Template");
    XLSX.writeFile(wb, "smartmart_product_catalog_template.xlsx");
  };

  // Fuzzy Header Matching function
  const detectColumnIndices = (headers) => {
    const cleanHeaders = headers.map(h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

    const findIndex = (keywords) => {
      return cleanHeaders.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const nameIdx = findIndex(['itemname', 'productname', 'item', 'product', 'particulars', 'desc', 'description', 'title', 'name']);
    const priceIdx = findIndex(['sellingprice', 'selling', 'saleprice', 'mrp', 'rate', 'sp', 'unitprice', 'retailprice', 'price']);
    const costIdx = findIndex(['costprice', 'cost', 'purchaseprice', 'purchase', 'cp', 'buyprice', 'wholesale']);
    const stockIdx = findIndex(['stockqty', 'stock', 'qty', 'quantity', 'count', 'units', 'avail', 'inventory']);
    const categoryIdx = findIndex(['category', 'cat', 'department', 'dept', 'type', 'group', 'section']);
    const barcodeIdx = findIndex(['barcode', 'sku', 'upc', 'ean', 'code', 'itemcode', 'itemno']);

    return { nameIdx, priceIdx, costIdx, stockIdx, categoryIdx, barcodeIdx };
  };

  // Convert raw 2D array of rows to items
  const parseRowsToItems = (rows) => {
    if (!rows || rows.length < 2) {
      throw new Error("File must contain at least a header row and one product row.");
    }

    const headers = rows[0];
    const { nameIdx, priceIdx, costIdx, stockIdx, categoryIdx, barcodeIdx } = detectColumnIndices(headers);

    if (nameIdx === -1) {
      throw new Error("Could not detect 'Item Name' or 'Product' column. Please check column headers.");
    }
    if (priceIdx === -1 && costIdx === -1) {
      throw new Error("Could not detect Price or Rate column (e.g. Selling Price, MRP, or Rate).");
    }

    const items = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawName = String(row[nameIdx] || '').trim();
      if (!rawName) continue;

      // Extract Selling Price
      let rawPrice = NaN;
      if (priceIdx !== -1 && row[priceIdx] !== undefined) {
        rawPrice = parseFloat(String(row[priceIdx]).replace(/[^0-9.]/g, ''));
      }

      // Extract Cost Price
      let rawCost = NaN;
      if (costIdx !== -1 && row[costIdx] !== undefined) {
        rawCost = parseFloat(String(row[costIdx]).replace(/[^0-9.]/g, ''));
      }

      // Fallbacks if one is missing
      if (isNaN(rawPrice) && !isNaN(rawCost)) {
        rawPrice = Math.round(rawCost * 1.3); // Default 30% markup if only CP is provided
      }
      if (isNaN(rawCost) && !isNaN(rawPrice)) {
        rawCost = Math.round(rawPrice * 0.7); // Default 30% margin if only SP is provided
      }

      if (isNaN(rawPrice) || rawPrice <= 0) continue;

      // Stock
      let rawStock = 20;
      if (stockIdx !== -1 && row[stockIdx] !== undefined) {
        const parsedStock = parseInt(String(row[stockIdx]).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsedStock)) rawStock = parsedStock;
      }

      // Category
      let rawCategory = 'Grocery & Staples';
      if (categoryIdx !== -1 && row[categoryIdx]) {
        const catStr = String(row[categoryIdx]).trim();
        if (catStr) rawCategory = catStr;
      }

      // Barcode
      let rawBarcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
      if (barcodeIdx !== -1 && row[barcodeIdx]) {
        const barStr = String(row[barcodeIdx]).trim();
        if (barStr) rawBarcode = barStr;
      }

      items.push({
        id: `PROD-${Date.now().toString().slice(-4)}-${i}`,
        name: rawName,
        price: rawPrice,
        costPrice: !isNaN(rawCost) ? rawCost : Math.round(rawPrice * 0.7),
        stock: rawStock,
        category: rawCategory,
        barcode: rawBarcode,
        unit: '1 unit'
      });
    }

    return items;
  };

  // Parse CSV text with quote support
  const parseCSVText = (text) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    const rows = [];
    for (let line of lines) {
      let row = [];
      let inQuotes = false;
      let curVal = '';
      for (let ch of line) {
        if (ch === '"' || ch === "'") {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          row.push(curVal.trim());
          curVal = '';
        } else if (ch === '\t' && !inQuotes) { // TSV support
          row.push(curVal.trim());
          curVal = '';
        } else {
          curVal += ch;
        }
      }
      row.push(curVal.trim());
      rows.push(row);
    }
    return parseRowsToItems(rows);
  };

  // Parse Excel (.xlsx / .xls)
  const parseExcelFile = async (fileObj) => {
    const data = await fileObj.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    return parseRowsToItems(rows);
  };

  // Parse PDF File using PDF.js or text line extraction
  const parsePdfFile = async (fileObj) => {
    if (!window.pdfjsLib) {
      throw new Error("PDF parser engine is initializing. Please re-try or use CSV / Excel format.");
    }

    const arrayBuffer = await fileObj.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullTextLines = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group text items by line using Y-coordinate
      const lineMap = new Map();
      for (const item of textContent.items) {
        const y = Math.round(item.transform[5]);
        if (!lineMap.has(y)) {
          lineMap.set(y, []);
        }
        lineMap.get(y).push(item.str);
      }

      // Sort descending by Y coordinate (top to bottom)
      const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
      for (const y of sortedY) {
        const rowTokens = lineMap.get(y).map(t => t.trim()).filter(Boolean);
        if (rowTokens.length > 0) {
          fullTextLines.push(rowTokens);
        }
      }
    }

    if (fullTextLines.length < 2) {
      throw new Error("Could not extract readable table rows from this PDF.");
    }

    // Try parsing as rows
    return parseRowsToItems(fullTextLines);
  };

  // Process File according to extension
  const handleFileProcess = async (selectedFile) => {
    if (!selectedFile) return;
    setErrorMsg('');
    setIsProcessing(true);
    setFile(selectedFile);

    try {
      const fileName = selectedFile.name.toLowerCase();
      let extractedItems = [];

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        extractedItems = await parseExcelFile(selectedFile);
      } else if (fileName.endsWith('.pdf')) {
        extractedItems = await parsePdfFile(selectedFile);
      } else {
        // Default to CSV / Text
        const text = await selectedFile.text();
        extractedItems = parseCSVText(text);
      }

      if (extractedItems.length === 0) {
        setErrorMsg("No valid product items could be extracted. Please check the file formatting.");
        soundEngine.playErrorBuzz();
      } else {
        setParsedItems(extractedItems);
        soundEngine.playScannerBeep();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to parse file. Please verify column layout or download the sample template.");
      soundEngine.playErrorBuzz();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileProcess(droppedFile);
    }
  };

  const handleRemoveParsedItem = (idx) => {
    setParsedItems(parsedItems.filter((_, i) => i !== idx));
  };

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;
    soundEngine.playCashDrawerDing();
    onImportSuccess(parsedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0c1222] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  Smart Bulk Product Import (CSV / Excel / PDF)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold">
                  Auto-Column Detection
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload your own CSV, Excel (.xlsx/.xls), or PDF price catalog. Fuzzy AI maps your columns automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Sample Template Dropdown / Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl p-1">
              <button
                onClick={handleDownloadCsvTemplate}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-cyan-300 text-xs font-semibold"
                title="Download Sample CSV Template"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>CSV</span>
              </button>
              <span className="text-slate-700">|</span>
              <button
                onClick={handleDownloadExcelTemplate}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-emerald-300 text-xs font-semibold"
                title="Download Sample Excel (.xlsx) Template"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel (.xlsx)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Zone */}
          {parsedItems.length === 0 ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-cyan-400 bg-cyan-950/40' 
                    : 'border-slate-700 hover:border-cyan-500/60 bg-slate-950/50 hover:bg-slate-950/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .tsv, .txt, .xlsx, .xls, .pdf"
                  className="hidden"
                  onChange={(e) => handleFileProcess(e.target.files?.[0])}
                />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  {isProcessing ? (
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 animate-bounce" />
                  )}
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  {isProcessing ? "Analyzing & Mapping Columns..." : "Drag & Drop CSV, Excel (.xlsx/.xls) or PDF here"}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-3">
                  Upload your existing store files. Our smart parser auto-matches variations of <strong>Product Name</strong>, <strong>Selling Price/MRP</strong>, <strong>Cost Price</strong>, <strong>Stock</strong>, and <strong>Barcode</strong>.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 font-semibold">
                    ✓ .CSV & .TSV
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 font-semibold">
                    ✓ Excel (.xlsx / .xls)
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-purple-300 font-semibold">
                    ✓ PDF Catalogs
                  </span>
                </div>
              </div>

              {/* Instructions Guide */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Smart Fuzzy Matching Engine Rules:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
                  <li><strong>Product Name:</strong> Matches <em>Item, Name, Product, Title, Description, or Particulars</em>.</li>
                  <li><strong>Selling Price / MRP:</strong> Matches <em>Rate, MRP, Selling Price, Price, SP, or Retail</em>.</li>
                  <li><strong>Cost Price (CP):</strong> Matches <em>Cost, Purchase Price, CP, or Wholesale</em> (used for P&L calculations).</li>
                  <li><strong>Stock Quantity:</strong> Matches <em>Qty, Quantity, Stock, Units, or Count</em>.</li>
                  <li><strong>Barcode / SKU:</strong> Matches <em>Barcode, SKU, Code, or UPC</em> (auto-generates standard 9-digit EAN if omitted).</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Parsed Items Preview & Confirm Table */
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">
                    Preview & Confirm:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px]">
                    {parsedItems.length} Products Found
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] truncate max-w-xs">
                    ({file?.name})
                  </span>
                </div>

                <button
                  onClick={() => { setFile(null); setParsedItems([]); }}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard & Choose Another File</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80 max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Cost Price (CP)</th>
                      <th className="py-2.5 px-3 text-right">Selling Price (SP)</th>
                      <th className="py-2.5 px-3 text-right">Stock</th>
                      <th className="py-2.5 px-3">Barcode</th>
                      <th className="py-2.5 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-200 font-sans">{item.name}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">{item.category}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">₹{(item.costPrice || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-cyan-300">₹{(item.price || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{item.stock}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[10px]">{item.barcode}</td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleRemoveParsedItem(idx)}
                            className="p-1 rounded hover:bg-rose-950/80 text-slate-500 hover:text-rose-400"
                            title="Remove this row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
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
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-mono text-slate-400">
              Total <strong className="text-emerald-400">{parsedItems.length}</strong> products will be imported into catalog
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => { setFile(null); setParsedItems([]); }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
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
