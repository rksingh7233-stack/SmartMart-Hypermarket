import React, { useState } from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  Edit2, 
  Check, 
  X, 
  AlertTriangle, 
  ShoppingCart,
  Sparkles,
  Info
} from 'lucide-react';
import { soundEngine } from '../services/audioService';
import { getStockThresholds } from '../services/storage';

export const CartTable = ({ 
  cart, 
  catalog,
  onUpdateQuantity, 
  onUpdatePrice, 
  onRemoveItem, 
  onClearCart,
  onAddToCart,
  selectedCategory
}) => {
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [showCatalogDrawer, setShowCatalogDrawer] = useState(true);

  const startEditPrice = (item) => {
    setEditingPriceId(item.id);
    setTempPrice(item.price.toString());
  };

  const saveEditPrice = (itemId) => {
    const parsed = parseFloat(tempPrice);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdatePrice(itemId, parsed);
    }
    setEditingPriceId(null);
  };

  const cancelEditPrice = () => {
    setEditingPriceId(null);
  };

  // Filter catalog based on selectedCategory
  const filteredCatalog = catalog.filter(p => {
    if (selectedCategory === "All Items") return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="space-y-4">
      {/* Cart Container */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
        {/* Cart Top Bar */}
        <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Current Cart Items</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-cyan-400/80 hidden sm:flex items-center gap-1 font-mono">
              <Info className="w-3 h-3" />
              Click any Price to edit
            </span>

            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-medium transition-all active:scale-95"
                title="Empty current cart"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear Cart</span>
              </button>
            )}
          </div>
        </div>

        {/* Cart Items Table */}
        <div className="overflow-x-auto min-h-[190px] max-h-[310px] overflow-y-auto">
          {cart.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center mb-2 text-slate-600">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-400">Cart is empty</p>
              <p className="text-xs text-slate-600 max-w-xs mt-0.5">
                Scan barcode, search products, or tap catalog items below to start billing.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-2.5 px-3 w-10 text-center">Sr</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-center w-28">Quantity</th>
                  <th className="py-2.5 px-3 text-right w-28">Price (₹)</th>
                  <th className="py-2.5 px-3 text-right w-24">Total</th>
                  <th className="py-2.5 px-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {cart.map((item, index) => {
                  const lowThreshold = getStockThresholds().low;
                  const isLowStock = item.stock <= lowThreshold;
                  const isEditing = editingPriceId === item.id;
                  const itemTotal = item.quantity * item.price;

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-cyan-950/20 transition-colors group"
                    >
                      {/* Sr */}
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                        {index + 1}
                      </td>

                      {/* Item Name & Stock Warning */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="text-slate-100 font-semibold">{item.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono">
                              Barcode: {item.barcode}
                            </span>
                            {isLowStock && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-1.5 py-0.2 rounded">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Low Stock: {item.stock} left
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Quantity (- / +) */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-cyan-300">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Price (Inline Edit Toggle) */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400 font-mono">₹</span>
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditPrice(item.id);
                                if (e.key === 'Escape') cancelEditPrice();
                              }}
                              autoFocus
                              className="w-16 px-1.5 py-0.5 text-right font-mono text-xs bg-slate-950 border border-cyan-400 rounded text-cyan-300 outline-none"
                            />
                            <button
                              onClick={() => saveEditPrice(item.id)}
                              className="p-1 rounded hover:bg-emerald-950 text-emerald-400"
                              title="Save Price"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEditPrice}
                              className="p-1 rounded hover:bg-rose-950 text-rose-400"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditPrice(item)}
                            className="group/btn inline-flex items-center gap-1 font-mono text-slate-200 hover:text-cyan-300 hover:bg-cyan-950/60 px-1.5 py-0.5 rounded transition-all"
                            title="Click to edit price"
                          >
                            <span>₹{item.price.toFixed(2)}</span>
                            <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100 text-cyan-400 transition-opacity" />
                          </button>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                        ₹{itemTotal.toFixed(2)}
                      </td>

                      {/* Action ❌ */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="w-6 h-6 inline-flex items-center justify-center rounded-lg hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 transition-all active:scale-95"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Catalog Quick-Tap Picker Grid */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quick Catalog Picker ({filteredCatalog.length} items in {selectedCategory})</span>
          </div>
          <button
            onClick={() => setShowCatalogDrawer(!showCatalogDrawer)}
            className="text-[11px] text-cyan-400 hover:underline"
          >
            {showCatalogDrawer ? "Hide Quick Catalog" : "Show Quick Catalog"}
          </button>
        </div>

        {showCatalogDrawer && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
            {filteredCatalog.map(product => {
              const isLowStock = product.stock <= getStockThresholds().low;
              return (
                <button
                  key={product.id}
                  onClick={() => onAddToCart(product)}
                  disabled={product.stock <= 0}
                  className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between group active:scale-[0.98] ${
                    product.stock <= 0
                      ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                      : 'bg-slate-950/60 hover:bg-cyan-950/40 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-200 group-hover:text-cyan-300 line-clamp-1">
                        {product.name}
                      </span>
                      {isLowStock && (
                        <span className="text-[9px] font-bold text-rose-400 bg-rose-950/90 border border-rose-500/50 px-1 rounded">
                          {product.stock}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{product.unit || product.category}</span>
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      ₹{product.price}
                    </span>
                    <span className="w-5 h-5 rounded-md bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                      <Plus className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
