import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Banknote, QrCode, AlertTriangle, Check, User, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatRupiah } from '../utils/formatters';

export default function PaymentModal({
  isOpen,
  onClose,
  cartItems = [],
  customerName = '',
  onCompletePayment
}) {
  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.harga_satuan * item.jumlah,
    0
  );
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.jumlah, 0);

  // Kanal Pembayaran: 'Tunai' | 'QRIS'
  const [paymentChannel, setPaymentChannel] = useState('Tunai');
  // Settlement status: 'LUNAS' | 'BELUM_LUNAS'
  const [settlementStatus, setSettlementStatus] = useState('LUNAS');
  // Cash received for Tunai
  const [cashReceived, setCashReceived] = useState(totalAmount);
  const [isProcessing, setIsProcessing] = useState(false);

  // When switching to QRIS: automatically set LUNAS, cashReceived = totalAmount, no change
  useEffect(() => {
    if (paymentChannel === 'QRIS') {
      setSettlementStatus('LUNAS');
      setCashReceived(totalAmount);
    }
  }, [paymentChannel, totalAmount]);

  const numericCash = Number(cashReceived) || 0;
  const changeAmount = numericCash - totalAmount;
  const isCashInsufficient = paymentChannel === 'Tunai' && settlementStatus === 'LUNAS' && numericCash < totalAmount;

  // Quick tap preset buttons for Tunai
  const quickAmounts = [
    { label: 'Uang Pas', value: totalAmount },
    { label: '50k', value: 50000 },
    { label: '70k', value: 70000 },
    { label: '100k', value: 100000 },
    { label: '150k', value: 150000 }
  ];

  const handleProcess = async () => {
    if (isCashInsufficient) return;
    setIsProcessing(true);

    try {
      const paymentData = {
        settlementStatus: paymentChannel === 'QRIS' ? 'LUNAS' : settlementStatus,
        paymentChannel,
        cashReceived: paymentChannel === 'QRIS' ? totalAmount : numericCash,
        changeAmount: paymentChannel === 'QRIS' ? 0 : Math.max(0, changeAmount),
        totalAmount,
        customerName
      };

      if (paymentData.settlementStatus === 'LUNAS') {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#f59e0b', '#10b981', '#3b82f6']
          });
        } catch (e) {
          // ignore confetti if unsupported
        }
      }

      await onCompletePayment(paymentData);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-0">
      <div 
        className="w-full max-w-md bg-[#18181b] border-t border-zinc-700/80 rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col animate-slide-up"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Handle bar & Header */}
        <div className="sticky top-0 bg-[#18181b] pt-3 pb-2 px-4 border-b border-zinc-800/80 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Pembayaran Kasir</h3>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <User className="w-3 h-3 text-amber-500" />
                <span className="font-semibold text-zinc-300">{customerName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Big Billing Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center shadow-inner">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Total Tagihan ({totalItemCount} Item)
            </span>
            <div className="text-3xl font-black text-amber-400 tracking-tight">
              {formatRupiah(totalAmount)}
            </div>
          </div>

          {/* 1. Kanal Pembayaran Sederhana: Tunai vs QRIS */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Pilih Metode Pembayaran:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentChannel('Tunai')}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold border transition-all ${
                  paymentChannel === 'Tunai'
                    ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-pos-glow'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tunai / Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentChannel('QRIS')}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold border transition-all ${
                  paymentChannel === 'QRIS'
                    ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-pos-glow'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS (Pencatatan)</span>
              </button>
            </div>
          </div>

          {/* 2. QRIS Mode (Pencatatan Murni: Tanpa form uang diterima, otomatis lunas pas) */}
          {paymentChannel === 'QRIS' ? (
            <div className="bg-zinc-900/90 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-2.5 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Metode QRIS Terpilih</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pembayaran dicatat langsung <strong className="text-emerald-400">LUNAS PAS</strong> sebesar {formatRupiah(totalAmount)} tanpa uang kembalian.
                </p>
              </div>
              <div className="bg-zinc-950 px-3 py-2 rounded-xl text-xs text-zinc-300 font-mono flex items-center justify-between border border-zinc-800">
                <span>Tagihan Bersih:</span>
                <span className="font-bold text-emerald-400">{formatRupiah(totalAmount)}</span>
              </div>
            </div>
          ) : (
            /* 3. Tunai Mode: Settlement Toggle & Cash Calculation */
            <div className="space-y-3.5">
              {/* Toggle Settlement: Lunas vs Kasbon */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Status Penyelesaian Tunai:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementStatus('LUNAS');
                      if (numericCash === 0) setCashReceived(totalAmount);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all ${
                      settlementStatus === 'LUNAS'
                        ? 'bg-emerald-600 text-white shadow-pos-success-glow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>LUNAS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSettlementStatus('BELUM_LUNAS');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all ${
                      settlementStatus === 'BELUM_LUNAS'
                        ? 'bg-red-600 text-white shadow-pos-danger-glow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>KASBON</span>
                  </button>
                </div>

                {settlementStatus === 'BELUM_LUNAS' && (
                  <div className="mt-2 bg-red-950/40 border border-red-500/40 rounded-xl p-2.5 flex items-start gap-2 text-xs text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      Pesanan dicatat sebagai <strong>Piutang Kasbon</strong> pelanggan <strong>{customerName}</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Input Uang Tunai Diterima */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Uang Tunai Diterima:
                  </label>
                  {settlementStatus === 'BELUM_LUNAS' && (
                    <button
                      type="button"
                      onClick={() => setCashReceived(0)}
                      className="text-[10px] font-bold text-amber-400 hover:underline"
                    >
                      Set Rp 0 (Belum Bayar)
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={cashReceived === 0 ? '' : cashReceived}
                    onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-zinc-900 text-white font-mono font-bold text-xl pl-11 pr-4 py-2.5 rounded-xl border border-zinc-700 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Quick Tap Buttons */}
              <div className="grid grid-cols-5 gap-1.5">
                {quickAmounts.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setCashReceived(q.value)}
                    className="py-1.5 px-1 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800 hover:border-amber-500/50 rounded-xl text-[11px] font-bold text-zinc-300 hover:text-amber-400 transition-all text-center truncate"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Kembalian / Sisa Tagihan */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3">
                {settlementStatus === 'LUNAS' ? (
                  isCashInsufficient ? (
                    <div className="flex items-center justify-between text-red-400 text-xs font-bold">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Uang Kurang
                      </span>
                      <span className="font-mono text-sm">{formatRupiah(totalAmount - numericCash)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-semibold">Uang Kembalian:</span>
                      <span className="text-emerald-400 font-mono font-extrabold text-base">
                        {formatRupiah(changeAmount)}
                      </span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-semibold">Sisa Tagihan Kasbon:</span>
                    <span className="text-red-400 font-mono font-extrabold text-sm">
                      {formatRupiah(Math.max(0, totalAmount - numericCash))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action CTA: Process Payment */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isCashInsufficient || isProcessing}
              onClick={handleProcess}
              className={`w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-all ${
                isCashInsufficient || isProcessing
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  : paymentChannel === 'QRIS' || settlementStatus === 'LUNAS'
                  ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-black shadow-emerald-500/20'
                  : 'bg-red-500 hover:bg-red-400 active:scale-98 text-white shadow-red-500/20'
              }`}
            >
              <CheckCircle className="w-5 h-5 stroke-[2.5]" />
              <span>
                {isProcessing
                  ? 'Menyimpan Transaksi...'
                  : paymentChannel === 'QRIS'
                  ? `Selesaikan QRIS (${formatRupiah(totalAmount)})`
                  : settlementStatus === 'LUNAS'
                  ? `Selesaikan Tunai (${formatRupiah(totalAmount)})`
                  : `Catat Kasbon (${formatRupiah(totalAmount)})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
