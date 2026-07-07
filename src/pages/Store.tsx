
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../constants';
import { ShoppingCart, Search, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { transactionService } from '../services/transactionService';

const StorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      transactionService.fetchByUserId(user.id).then(res => {
        if (res.data) {
          const productNames = res.data.filter(t => t.product).map(t => t.product);
          const ids = MOCK_PRODUCTS.filter(p => productNames.includes(p.name)).map(p => p.id);
          setPurchasedIds(ids);
        }
      });
    }
  }, [user?.id]);

  const handleBuy = async (id: string) => {
    const product = MOCK_PRODUCTS.find(p => p.id === id);
    if (!product || !user?.id) return;
    await transactionService.recordPurchase(user.id, user.name || '', product.name, product.price);
    setPurchasedIds(prev => [...prev, id]);
    setCartCount(prev => prev + 1);
  };

  return (
    <div className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 py-6 px-4 md:px-0 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:gap-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
        >
          <ArrowLeft size={18} className="sm:w-5 sm:h-5 text-black group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-1 sm:mb-2 text-slate-900">The Vault.</h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Premium Strategic Assets</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                type="text" 
                placeholder="Search..." 
                aria-label="Search products"
                className="pl-10 pr-4 py-3.5 sm:py-4 bg-white border border-black/[0.03] rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest w-full md:w-64 focus:border-black outline-none transition-all shadow-sm"
              />
            </div>
            <button className="p-3.5 sm:p-4 bg-white border border-black/[0.03] rounded-xl sm:rounded-2xl relative hover:bg-slate-50 transition-all shrink-0 shadow-sm active:scale-90" aria-label="Shopping cart">
              <ShoppingCart size={18} className="sm:w-5 sm:h-5 text-slate-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-black text-white text-[9px] sm:text-[10px] flex items-center justify-center rounded-full font-black animate-in zoom-in" aria-live="polite">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {MOCK_PRODUCTS.map((product) => {
          const isOwned = purchasedIds.includes(product.id);
          return (
            <div key={product.id} className="group bg-white border border-black/[0.03] rounded-[32px] sm:rounded-[48px] overflow-hidden hover:shadow-xl hover:border-black/10 transition-all duration-500 flex flex-col">
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                  <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest shadow-sm">
                    {product.category}
                  </span>
                </div>
              </div>
              <div className="p-6 sm:p-8 flex flex-col flex-1">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-2 sm:mb-3">{product.name}</h3>
                <p className="text-slate-400 text-[10px] sm:text-xs mb-6 sm:mb-8 line-clamp-2 leading-relaxed font-semibold">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 sm:pt-6 border-t border-black/[0.02]">
                  <span className="text-xl sm:text-2xl font-black text-black">${product.price}</span>
                  <button 
                    onClick={() => handleBuy(product.id)}
                    disabled={isOwned}
                    className={`
                      btn-compact flex items-center gap-2
                      ${isOwned 
                        ? 'bg-emerald-50 text-emerald-600 cursor-default opacity-100' 
                        : 'bg-black text-white hover:bg-slate-800'}
                    `}
                  >
                    {isOwned ? <><Check size={14} /> Owned</> : <>Buy <ArrowRight size={14} /></>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StorePage;
