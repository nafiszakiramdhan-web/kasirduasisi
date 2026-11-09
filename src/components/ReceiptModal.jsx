import React from 'react';
import { X, Printer, Share2, CheckCircle, Clock } from 'lucide-react';
import { formatRupiah, formatDateTime } from '../utils/formatters';

export default function ReceiptModal({ isOpen, onClose, transaction }) {
  if (!isOpen || !transaction) return null;

  const order = transaction.order || {};
  const items = transaction.items || [];
  const isLunas = transaction.status_settlement === 'LUNAS';

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `*STRUK KASIR DUA SISI COFFEE*\nNo: ${order.no_trx || transaction.id_transaksi.slice(0, 8)}\nCustomer: ${order.nama_customer}\nTotal: ${formatRupiah(order.total_akhir)}\nStatus: ${isLunas ? 'LUNAS' : 'KASBON (BELUM LUNAS)'}\nMetode: ${transaction.kanal_pembayaran}`;
    if (navigator.share) {
      navigator.share({
        title: 'Struk Dua Sisi Coffee',
        text
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Teks struk berhasil disalin ke clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-zinc-800/90 px-4 py-2.5 flex items-center justify-between border-b border-zinc-700/80">
          <span className="text-xs font-bold text-zinc-300">Struk Transaksi Digital</span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body (Thermal Receipt Style) */}
        <div className="p-4 overflow-y-auto flex-1 bg-white text-zinc-900 font-mono text-xs select-text">
          {/* Brand Header */}
          <div className="text-center pb-3 border-b-2 border-dashed border-zinc-400">
            <h2 className="text-base font-black tracking-tight text-black">DUA SISI COFFEE</h2>
            <p className="text-[10px] text-zinc-600 font-sans">Specialty Coffee & Roastery</p>
            <p className="text-[9px] text-zinc-500 font-sans">Jl. Sudirman No. 42 • Telp: (021) 7891234</p>
          </div>

          {/* Meta Info */}
          <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-600">No. Trx:</span>
              <span className="font-bold">{order.no_trx || transaction.id_transaksi.slice(0, 10)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Waktu:</span>
              <span>{formatDateTime(transaction.tanggal_transaksi)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Pelanggan:</span>
              <span className="font-bold">{order.nama_customer || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Layanan:</span>
              <span>{order.tipe_layanan} {order.nomor_meja ? `(${order.nomor_meja})` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Kasir / Shift:</span>
              <span>{transaction.kasir_pencatat} / {transaction.shift}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-2.5 border-b-2 border-dashed border-zinc-400 space-y-2">
            {items.map((it) => (
              <div key={it.id_detail}>
                <div className="flex justify-between items-baseline font-bold text-[11px]">
                  <span>{it.nama_menu}</span>
                  <span>{formatRupiah(it.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600 pl-2">
                  <span>{it.jumlah} x {formatRupiah(it.harga_satuan)}</span>
                  {it.catatan && <span className="italic truncate max-w-[120px]">({it.catatan})</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2.5 border-b-2 border-dashed border-zinc-400 space-y-1 text-[11px]">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal:</span>
              <span>{formatRupiah(order.subtotal || order.total_akhir)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Diskon:</span>
              <span>Rp 0</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Pajak Resto (PB1):</span>
              <span>Rp 0 (Termasuk)</span>
            </div>
            <div className="flex justify-between font-black text-sm pt-1 text-black">
              <span>TOTAL:</span>
              <span>{formatRupiah(order.total_akhir)}</span>
            </div>
          </div>

          {/* Payment & Settlement */}
          <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-600">Metode Bayar:</span>
              <span className="font-bold">{transaction.kanal_pembayaran}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Uang Diterima:</span>
              <span>{formatRupiah(transaction.nominal_diterima)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Kembalian:</span>
              <span>{formatRupiah(transaction.kembalian)}</span>
            </div>

            <div className="pt-2 text-center">
              {isLunas ? (
                <div className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full text-xs">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>STATUS: LUNAS</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 border border-red-300 px-3 py-1 rounded-full text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>STATUS: KASBON / BELUM LUNAS</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-3 text-center text-[10px] text-zinc-500 font-sans space-y-0.5">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Follow Instagram kami: @duasisicoffee</p>
            <p className="text-[9px] text-zinc-400 pt-1">*** SIMPAN STRUK INI SEBAGAI BUKTI PEMBAYARAN ***</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-900 p-3 border-t border-zinc-800 flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-zinc-700 transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan / Salin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
