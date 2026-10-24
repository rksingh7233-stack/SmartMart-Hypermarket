import React, { useState, useRef } from 'react';
import { Search, Barcode, Plus, Zap, Check, AlertCircle } from 'lucide-react';
import { soundEngine } from '../services/audioService';

export const BarcodeScannerBar = ({ 
  catalog, 
  onAddToCart, 
  onOpenNewProductModal,
  selectedCategory,
  onSelectCategory 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scanMessage, setScanMessage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef(null);

  const categories = [
    "All Items",
    "Grocery & Staples",
    "Dairy & Essentials",
    "Snacks & Treats",
    "Beverages",
    "Personal Care"
  ];

  // Handle scan or search submission
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearchOrScan(searchTerm.trim());
    }
  };

  const executeSearchOrScan = (term) => {
    if (!term) return;

    // Search by exact barcode or partial product name
    const foundByBarcode = catalog.find(p => p.barcode === term);
    const foundByName = catalog.find(p => p.name.toLowerCase().includes(term.toLowerCase()));
    const product = foundByBarcode || foundByName;

    if (product) {
      if (product.stock <= 0) {
        soundEngine.playErrorBuzz();
        setScanMessage({ type: 'error', text: `${product.name} is OUT OF STOCK!` });
      } else {
        soundEngine.playScannerBeep();
        onAddToCart(product);
        setScanMessage({ type: 'success', text: `Scanned: ${product.name} (₹${product.price})` });
        setSearchTerm('');
      }
    } else {
      soundEngine.playErrorBuzz();
      setScanMessage({ type: 'error', text: `Product not found for: "${term}"` });
    }

    setTimeout(() => setScanMessage(null), 3000);
  };

  // Quick simulate barcode laser scan
  const handleSimulateLaserScan = () => {
    setIsScanning(true);
    // Pick a random product from catalog to simulate quick scan gun trigger
    const randomProduct = catalog[Math.floor(Math.random() * catalog.length)];
    soundEngine.playScannerBeep();
    
    setTimeout(() => {
      onAddToCart(randomProduct);
      setScanMessage({ type: 'success', text: `Laser Scanned: ${randomProduct.name}` });
      setIsScanning(false);
      setTimeout(() => setScanMessage(null), 2500);
    }, 200);
  };

  return (
    <div className="space-y-3">
      {/* Top Search & Action Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Product or Scan Barcode (e.g. 890103001001 or Rice)..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-500 text-sm outline-none transition-all font-mono"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
            <button
              onClick={() => executeSearchOrScan(searchTerm.trim())}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold transition-all"
            >
              Enter ↵
            </button>
          </div>
        </div>

        {/* Laser Scanner Sim Trigger */}
        <button
          onClick={handleSimulateLaserScan}
          disabled={isScanning}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all active:scale-95 ${isScanning ? 'animate-pulse' : ''}`}
          title="Simulate hardware barcode gun scan"
        >
          <Barcode className="w-4 h-4" />
          <span className="hidden sm:inline">Laser Scan</span>
        </button>

        {/* + New Product modal trigger */}
        <button
          onClick={onOpenNewProductModal}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 hover:text-white text-xs font-bold transition-all active:scale-95 whitespace-nowrap shadow"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>+ New Product</span>
        </button>
      </div>

      {/* Feedback Toast if scanned */}
      {scanMessage && (
        <div className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 animate-fadeIn ${
          scanMessage.type === 'success' 
            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' 
            : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
        }`}>
          {scanMessage.type === 'success' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>{scanMessage.text}</span>
        </div>
      )}

      {/* Category Pills for quick filtering */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
