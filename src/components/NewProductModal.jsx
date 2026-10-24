import React, { useState } from 'react';
import { X, Plus, Barcode, PackagePlus, Sparkles } from 'lucide-react';
import { soundEngine } from '../services/audioService';

export const NewProductModal = ({ isOpen, onClose, onAddProduct }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Grocery & Staples');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('25');
  const [unit, setUnit] = useState('1 pc');
  const [barcode, setBarcode] = useState('');

  if (!isOpen) return null;

  const generateBarcode = () => {
    const randomCode = `8901${Math.floor(10000000 + Math.random() * 90000000)}`;
    setBarcode(randomCode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      soundEngine.playErrorBuzz();
      alert("Please provide product name and price");
      return;
    }

    const newProd = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      category,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 10,
      barcode: barcode.trim() || `8901${Math.floor(10000000 + Math.random() * 90000000)}`,
      unit: unit.trim() || '1 pc',
      popular: false
    };

    soundEngine.playScannerBeep();
    onAddProduct(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Add New Product to Catalog</h3>
              <p className="text-xs text-slate-400">Instant SKU creation & barcode registration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Brown Sugar (1kg)"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-400 outline-none"
              >
                <option value="Grocery & Staples">Grocery & Staples</option>
                <option value="Dairy & Essentials">Dairy & Essentials</option>
                <option value="Snacks & Treats">Snacks & Treats</option>
                <option value="Beverages">Beverages</option>
                <option value="Personal Care">Personal Care</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Unit / Pack Size</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 500g pouch"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold focus:border-cyan-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Initial Stock Count</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold">Barcode</label>
              <button
                type="button"
                onClick={generateBarcode}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Auto-Generate
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="8901..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/25"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
