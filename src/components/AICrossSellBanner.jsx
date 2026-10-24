import React from 'react';
import { Sparkles, ArrowRight, Zap, ShoppingBag, Plus } from 'lucide-react';
import { soundEngine } from '../services/audioService';

export const AICrossSellBanner = ({ 
  cart, 
  activeCustomer, 
  catalog, 
  onAddToCart 
}) => {
  // Determine recommendation based on customer habit or cart items
  let suggestion = null;

  // 1. Check active customer's habit item first
  if (activeCustomer && activeCustomer.habitItem) {
    const isAlreadyInCart = cart.some(item => 
      item.name.toLowerCase().includes(activeCustomer.habitItem.toLowerCase())
    );

    if (!isAlreadyInCart) {
      const habitProduct = catalog.find(p => 
        p.name.toLowerCase().includes(activeCustomer.habitItem.toLowerCase())
      );
      if (habitProduct && habitProduct.stock > 0) {
        suggestion = {
          type: 'habit',
          tag: 'Customer Habit Pattern Detected',
          text: activeCustomer.habitPrompt || `${activeCustomer.salutation || activeCustomer.name} usually buys ${habitProduct.name} — Suggest it?`,
          product: habitProduct
        };
      }
    }
  }

  // 2. If no habit prompt or habit item is in cart, check cart item cross-sells
  if (!suggestion && cart.length > 0) {
    // Find the latest item or item with crossSell
    for (const item of [...cart].reverse()) {
      if (item.customPrompt) {
        // Find matching product if any
        const matched = catalog.find(p => item.crossSell && item.crossSell.includes(p.name));
        suggestion = {
          type: 'cross-sell',
          tag: 'AI Basket Intelligence',
          text: item.customPrompt,
          product: matched || null
        };
        break;
      }

      if (item.crossSell && item.crossSell.length > 0) {
        // Find a cross-sell product not currently in cart
        const unaddedName = item.crossSell.find(recName => 
          !cart.some(c => c.name.toLowerCase() === recName.toLowerCase())
        );

        if (unaddedName) {
          const recProduct = catalog.find(p => p.name.toLowerCase() === unaddedName.toLowerCase());
          if (recProduct && recProduct.stock > 0) {
            suggestion = {
              type: 'cross-sell',
              tag: 'Smart Association Rule',
              text: `Customers who bought ${item.name.split(' (')[0]} frequently bundle with ${recProduct.name}!`,
              product: recProduct
            };
            break;
          }
        }
      }
    }
  }

  // Fallback default smart promotion if cart is empty or no specific match
  if (!suggestion) {
    const fallbackProduct = catalog.find(p => p.popular && !cart.some(c => c.id === p.id)) || catalog[0];
    suggestion = {
      type: 'popular',
      tag: 'Trending In-Store Today',
      text: `Trending Deal: ${fallbackProduct?.name || "Cadbury Dairy Milk Silk"} is high in demand today!`,
      product: fallbackProduct
    };
  }

  const handleAddSuggestion = () => {
    if (suggestion.product) {
      soundEngine.playScannerBeep();
      onAddToCart(suggestion.product);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/70 via-indigo-950/70 to-purple-950/70 border border-cyan-500/30 p-3 shadow-lg shadow-cyan-950/30">
      {/* Decorative cyber ambient glow */}
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 mt-0.5 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {suggestion.tag}
              </span>
              {suggestion.type === 'habit' && (
                <span className="text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Personalized AI
                </span>
              )}
            </div>
            <p className="text-xs text-slate-100 font-medium mt-1 leading-snug">
              {suggestion.text}
            </p>
          </div>
        </div>

        {suggestion.product && (
          <button
            onClick={handleAddSuggestion}
            className="self-stretch sm:self-auto shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/30 transition-all active:scale-95 group"
          >
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform text-slate-950" />
            <span>Add ₹{suggestion.product.price}</span>
          </button>
        )}
      </div>
    </div>
  );
};
