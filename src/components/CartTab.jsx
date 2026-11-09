import React, { useState } from 'react';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, AlertCircle, Edit3, User } from 'lucide-react';
import { formatRupiah, DEFAULT_LOGO_URL } from '../utils/formatters';

export default function CartTab({
  cartItems = [],
  customerName = '',
  setCustomerName,
  onUpdateQuantity,
  onUpdateNote,
  onRemoveItem,
  onClearCart,
  onBackToCatalog,
  onProceedToPayment
}) {
  const [nameError, setNameError] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Subtotal calculation
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.harga_satuan * item.jumlah,
    0
  );
  const discount = 0;
  const taxAndService = 0;
  const totalAmount = Math.max(0, subtotal - discount + taxAndService);

  const handleCheckoutClick = () => {
    if (!customerName.trim()) {
      setNameError(true);
      const nameInput = document.getElementById('customer-name-input');
      if (nameInput) {
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setNameError(false);
    onProceedToPayment();
  };

  return (
    <div className="pb-32 pt-2 px-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            title="Kembali ke Katalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-white">Detail Pesanan</h2>
            <p className="text-[11px] text-zinc-400">Keranjang kasir aktif</p>
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Kosongkan semua item di keranjang?')) {
                onClearCart();
              }
            }}
            className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>KOSONGKAN</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {cartItems.length === 0 ? (
        <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl p-8 text-center my-6 shadow-pos-card">
          <div className="w-16 h-16 rounded-full bg-zinc-800/80 mx-auto flex items-center justify-center text-zinc-500 mb-4">
            <ShoppingBag className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Keranjang Masih Kosong</h3>
          <p className="text-xs text-zinc-400 mb-5 max-w-xs mx-auto">
            Belum ada menu yang dipilih. Buka tab katalog untuk menambahkan pesanan kopi favorit pelanggan.
          </p>
          <button
            type="button"
            onClick={onBackToCatalog}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Pilih Menu Sekarang</span>
          </button>
        </div>
      ) : (
        <>
          {/* Customer Name Section (Simple & Focused: only Nama Pelanggan) */}
          <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl p-3.5 mb-4 shadow-pos-card">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              <span>Nama Pelanggan <strong className="text-red-400">*</strong></span>
            </label>

            <input
              id="customer-name-input"
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (nameError && e.target.value.trim()) setNameError(false);
              }}
              placeholder="Masukkan nama pelanggan (contoh: Dimas, Rina)..."
              className={`w-full bg-zinc-900 text-white px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                nameError
                  ? 'border-red-500 ring-1 ring-red-500/50 bg-red-950/20'
                  : 'border-zinc-800 focus:border-amber-500'
              }`}
            />
            {nameError && (
              <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Nama pelanggan wajib diisi sebelum melanjutkan pembayaran.
              </p>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Daftar Pesanan ({cartItems.reduce((s, i) => s + i.jumlah, 0)} item)
              </h3>
              <span className="text-[11px] text-zinc-500">Harga / Porsi</span>
            </div>

            {cartItems.map((item) => {
              const itemTotal = item.harga_satuan * item.jumlah;
              const isEditingNote = editingNoteId === item.id_menu;

              return (
                <div
                  key={item.id_menu}
                  className="bg-[#1e1e1e] border border-zinc-800/90 rounded-2xl p-3 shadow-pos-card transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Item Thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-zinc-900 overflow-hidden flex-shrink-0 border border-zinc-800">
                      <img
                        src={item.foto_url || DEFAULT_LOGO_URL}
                        alt={item.nama_menu}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* Info & Title */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-sm text-white truncate leading-snug">
                          {item.nama_menu}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id_menu)}
                          className="text-zinc-500 hover:text-red-400 p-1 -mr-1 transition-colors"
                          title="Hapus menu ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs font-semibold text-zinc-400 mb-1">
                        {formatRupiah(item.harga_satuan)}
                      </p>

                      {/* Custom Note Pill / Button */}
                      {!isEditingNote && (
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(item.id_menu)}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-amber-400 bg-zinc-900/90 border border-zinc-800/90 px-2 py-0.5 rounded-lg transition-colors mt-0.5"
                        >
                          <Edit3 className="w-3 h-3 text-amber-500" />
                          <span className="truncate max-w-[170px]">
                            {item.catatan ? `Catatan: "${item.catatan}"` : '+ Tambah catatan'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Custom Note Textarea */}
                  {isEditingNote && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/70">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-semibold text-zinc-400 uppercase">
                          Catatan Khusus Barista:
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="text-[10px] font-bold text-amber-400 hover:underline"
                        >
                          Selesai
                        </button>
                      </div>
                      <textarea
                        value={item.catatan || ''}
                        onChange={(e) => onUpdateNote(item.id_menu, e.target.value)}
                        placeholder="Contoh: Less sweet, no ice, extra shot..."
                        rows={2}
                        className="w-full bg-zinc-900 text-white text-xs px-2.5 py-1.5 rounded-xl border border-zinc-700 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  {/* Stepper & Subtotal */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/60">
                    {/* Stepper Controls */}
                    <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-xl overflow-hidden p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id_menu, item.jumlah - 1)}
                        className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                        aria-label="Kurangi kuantitas"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-extrabold text-white">
                        {item.jumlah}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id_menu, item.jumlah + 1)}
                        className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                        aria-label="Tambah kuantitas"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal Item */}
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block leading-none">Subtotal</span>
                      <span className="text-sm font-extrabold text-amber-400 leading-tight">
                        {formatRupiah(itemTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Billing Summary Card */}
          <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl p-4 mb-4 shadow-pos-card">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
              Ringkasan Pembayaran
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal ({cartItems.reduce((s, i) => s + i.jumlah, 0)} item)</span>
                <span className="font-semibold text-zinc-200">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Diskon / Promo</span>
                <span className="font-semibold text-emerald-400">{formatRupiah(discount)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Pajak Resto & Service (PB1 0%)</span>
                <span className="font-semibold text-zinc-300">Rp 0</span>
              </div>

              <div className="pt-2.5 mt-2 border-t border-zinc-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total Tagihan</span>
                <span className="text-lg font-black text-amber-400">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* CTA: Lanjut ke Pembayaran */}
          <button
            type="button"
            onClick={handleCheckoutClick}
            className="w-full bg-amber-500 hover:bg-amber-400 active:scale-98 text-black font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>Lanjut ke Pembayaran</span>
            <span className="text-black/80 font-mono">({formatRupiah(totalAmount)})</span>
          </button>
        </>
      )}
    </div>
  );
}
