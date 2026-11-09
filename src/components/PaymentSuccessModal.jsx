import React from 'react';
import { CheckCircle, Clock, Banknote, QrCode, ArrowRight, User } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function PaymentSuccessModal({
  isOpen,
  onClose,
  transaction
}) {
  if (!isOpen || !transaction) return null;

  const order = transaction.order || {};
  const isLunas = transaction.status_settlement === 'LUNAS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-[#18181b] border border-zinc-700/80 rounded-3xl p-5 shadow-2xl text-center animate-slide-up space-y-4">
        {/* Status Icon */}
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform transform scale-105">
          {isLunas ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-10 h-10 stroke-[2.5]" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400">
              <Clock className="w-10 h-10 stroke-[2.5]" />
            </div>
          )}
        </div>

        {/* Title & Customer */}
        <div>
          <h3 className="text-lg font-black text-white">
            {isLunas ? 'Pembayaran Sukses!' : 'Kasbon Berhasil Dicatat!'}
          </h3>
          <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5 mt-1">
            <User className="w-3.5 h-3.5 text-amber-500" />
            <span>Pelanggan: <strong className="text-zinc-200">{order.nama_customer || '-'}</strong></span>
          </p>
        </div>

        {/* Change / Kembalian or Kasbon Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-inner space-y-2">
          {isLunas ? (
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Uang Kembalian:
              </span>
              <div className="text-2xl font-black text-emerald-400 tracking-tight mt-0.5">
                {formatRupiah(transaction.kembalian || 0)}
              </div>
            </div>
          ) : (
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Sisa Tagihan Piutang:
              </span>
              <div className="text-2xl font-black text-red-400 tracking-tight mt-0.5">
                {formatRupiah(order.total_akhir || 0)}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center text-xs text-zinc-400">
            <span>Total Tagihan:</span>
            <span className="font-bold text-zinc-200">{formatRupiah(order.total_akhir)}</span>
          </div>

          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>Metode Bayar:</span>
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              {transaction.kanal_pembayaran === 'QRIS' ? (
                <>
                  <QrCode className="w-3.5 h-3.5" /> QRIS
                </>
              ) : (
                <>
                  <Banknote className="w-3.5 h-3.5" /> Tunai
                </>
              )}
            </span>
          </div>
        </div>

        {/* Action Button: Transaksi Baru */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-amber-500 hover:bg-amber-400 active:scale-98 text-black font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
        >
          <span>Transaksi Baru (Selesai)</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
