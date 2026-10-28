import React, { useState } from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  Edit2, 
  Check, 
  X, 
  ShoppingCart,
  Info
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

export const CartTable = ({ 
  cart, 
  onUpdateQuantity, 
  onUpdatePrice, 
  onRemoveItem, 
  onClearCart
}) => {
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

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
        <div className="overflow-x-auto min-h-[220px] max-h-[380px] overflow-y-auto">
          {cart.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-slate-800/60 flex items-center justify-center mb-3 text-slate-600">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-300">Cart is empty</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Scan barcode or search products using the top search bar to start billing.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800/80 text-[11px] font-mono uppercase tracking-wider text-slate-400 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  <th className="py-2.5 px-3 text-center w-10">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {cart.map((item) => {
                  const itemTotal = item.price * item.quantity;
                  const isEditingPrice = editingPriceId === item.id;

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & Unit */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                          <span>{item.category || 'General'}</span>
                          <span>•</span>
                          <span>Stock: {item.stock}</span>
                        </div>
                      </td>

                      {/* Quantity Stepper */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-950/80 border border-slate-700/80 rounded-lg p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-mono font-bold text-slate-200 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Unit Price (Editable) */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditingPrice ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400 text-xs">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditPrice(item.id);
                                if (e.key === 'Escape') cancelEditPrice();
                              }}
                              autoFocus
                              className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-cyan-400 text-right text-xs font-mono text-cyan-300 outline-none"
                            />
                            <button
                              onClick={() => saveEditPrice(item.id)}
                              className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEditPrice}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
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
    </div>
  );
};
