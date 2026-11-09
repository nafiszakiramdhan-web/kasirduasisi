import React from 'react';
import { Coffee, ShoppingBag, Receipt, UtensilsCrossed } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, cartCount = 0, pendingKasbonCount = 0 }) {
  const navItems = [
    {
      id: 'catalog',
      label: 'Katalog',
      icon: Coffee,
      badge: null
    },
    {
      id: 'cart',
      label: 'Pesanan',
      icon: ShoppingBag,
      badge: cartCount > 0 ? (
        <span className="absolute -top-1.5 -right-2 bg-amber-500 text-black text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
          {cartCount > 9 ? '9+' : cartCount}
        </span>
      ) : null
    },
    {
      id: 'history',
      label: 'Riwayat',
      icon: Receipt,
      badge: pendingKasbonCount > 0 ? (
        <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold px-1.5 h-4 rounded-full flex items-center justify-center shadow-md border border-zinc-900 animate-pulse">
          {pendingKasbonCount} kasbon
        </span>
      ) : null
    },
    {
      id: 'menu',
      label: 'Kelola Menu',
      icon: UtensilsCrossed,
      badge: null
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#18181b]/98 backdrop-blur border-t border-pos-border px-2 py-1 max-w-md mx-auto shadow-2xl pb-safe">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-amber-400 bg-amber-500/10 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-amber-400' : ''}`} />
                {item.badge}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight leading-none ${isActive ? 'font-bold text-amber-400' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5 shadow-pos-glow"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
