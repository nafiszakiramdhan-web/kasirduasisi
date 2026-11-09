import React, { useState, useMemo } from 'react';
import { Search, Plus, Sparkles, X, ChevronRight, ShoppingBag, Coffee } from 'lucide-react';
import { formatRupiah, DEFAULT_LOGO_URL } from '../utils/formatters';

const CATEGORIES = [
  'Semua',
  'Best Seller',
  'Signature Dua Sisi',
  'Coffee',
  'Milk Based',
  'Ice Blended',
  'Non-Coffee'
];

export default function CatalogTab({
  menus = [],
  cartItems = [],
  onAddToCart,
  onViewCart
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Map cart items for quick quantity lookup on menu cards
  const cartItemQuantities = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      map[item.id_menu] = (map[item.id_menu] || 0) + item.jumlah;
    });
    return map;
  }, [cartItems]);

  // Total cart calculation for floating pill
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.jumlah, 0);
  }, [cartItems]);

  const totalCartAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.harga_satuan * item.jumlah, 0);
  }, [cartItems]);

  // Filtered menu list
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      // Check active state
      if (!menu.is_active) return false;

      // Filter by category
      if (selectedCategory === 'Best Seller') {
        if (!menu.is_best_seller) return false;
      } else if (selectedCategory !== 'Semua') {
        if (menu.id_kategori !== selectedCategory) return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = menu.nama_menu.toLowerCase().includes(query);
        const matchesCategory = (menu.id_kategori || '').toLowerCase().includes(query);
        const matchesDesc = (menu.deskripsi || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesDesc) return false;
      }

      return true;
    });
  }, [menus, selectedCategory, searchQuery]);

  return (
    <div className="pb-32 pt-2 px-3">
      {/* Search Input Bar */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-4 h-4 text-zinc-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari menu kopi, rasa, atau varian..."
          className="w-full bg-zinc-900/90 text-white pl-9 pr-9 py-2.5 rounded-xl border border-zinc-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-sm placeholder-zinc-500 transition-colors shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Category Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2 -mx-3 px-3">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const isBestSeller = cat === 'Best Seller';

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
                isSelected
                  ? 'bg-amber-500 text-black border-amber-500 shadow-pos-glow'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
              }`}
            >
              {isBestSeller && (
                <Sparkles className={`w-3 h-3 ${isSelected ? 'text-black' : 'text-amber-400'}`} />
              )}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Menu Count Header */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {selectedCategory === 'Semua' ? 'Semua Menu' : selectedCategory} ({filteredMenus.length})
        </span>
        <span className="text-[11px] text-zinc-500">Tap (+) untuk pesan cepat</span>
      </div>

      {/* Menu Cards Grid */}
      {filteredMenus.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center my-6">
          <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto flex items-center justify-center text-zinc-500 mb-3">
            <Coffee className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-300 mb-1">Menu Tidak Ditemukan</h3>
          <p className="text-xs text-zinc-500 mb-3">
            Tidak ada menu yang sesuai dengan pencarian "{searchQuery}" di kategori ini.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Semua');
            }}
            className="text-xs font-bold text-amber-400 hover:underline"
          >
            Reset Filter & Cari Ulang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredMenus.map((menu) => {
            const inCartQty = cartItemQuantities[menu.id_menu] || 0;

            return (
              <div
                key={menu.id_menu}
                className="group relative bg-[#1e1e1e] border border-zinc-800/80 hover:border-amber-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-pos-card"
              >
                {/* Image Section */}
                <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={menu.foto_url || DEFAULT_LOGO_URL}
                    alt={menu.nama_menu}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  {/* Best Seller Badge */}
                  {menu.is_best_seller === 1 && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
                      <Sparkles className="w-2.5 h-2.5 fill-black" />
                      <span>BEST SELLER</span>
                    </div>
                  )}

                  {/* Category Pill on Image */}
                  <div className="absolute bottom-2 left-2">
                    <span className="text-[10px] font-medium bg-zinc-950/80 text-zinc-300 px-2 py-0.5 rounded backdrop-blur border border-zinc-700/60">
                      {menu.id_kategori}
                    </span>
                  </div>

                  {/* Cart Quantity Badge (if in cart) */}
                  {inCartQty > 0 && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-black font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-zinc-900 animate-scale">
                      {inCartQty}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight line-clamp-1 mb-1 group-hover:text-amber-400 transition-colors">
                      {menu.nama_menu}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                      {menu.deskripsi || 'Varian minuman istimewa racikan Dua Sisi Coffee.'}
                    </p>
                  </div>

                  {/* Price & Add Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 leading-none">Harga</span>
                      <span className="text-sm font-extrabold text-amber-400">
                        {formatRupiah(menu.harga)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddToCart(menu)}
                      aria-label={`Tambah ${menu.nama_menu} ke keranjang`}
                      className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-90 text-black flex items-center justify-center font-bold shadow-md hover:shadow-pos-glow transition-all duration-150"
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Order Pill */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 z-30 pointer-events-none animate-slide-up">
          <div className="pointer-events-auto bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/40 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between shadow-pos-glow">
            <div className="flex items-center gap-3 pl-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  <span className="font-extrabold text-amber-400">{totalCartCount} Item</span> Terpilih
                </p>
                <p className="text-sm font-extrabold text-white">
                  {formatRupiah(totalCartAmount)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onViewCart}
              className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1 shadow-md transition-all"
            >
              <span>Lihat Pesanan</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
