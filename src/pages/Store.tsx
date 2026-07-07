
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, ArrowLeft } from 'lucide-react';

const StorePage: React.FC = () => {
  const navigate = useNavigate();

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
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center py-24">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No products available yet</p>
      </div>
    </div>
  );
};

export default StorePage;
