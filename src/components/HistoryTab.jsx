import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Banknote, 
  QrCode, 
  ChevronRight, 
  Calendar, 
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Flame,
  Check
} from 'lucide-react';
import { formatRupiah, formatDateTime, formatTimeOnly, getDurationFromNow } from '../utils/formatters';
import { exportMonthlyReportToExcel } from '../utils/excelExporter';

export default function HistoryTab({
  orders = [],
  transactions = [],
  orderDetails = [],
  menus = [],
  onSettleKasbon
}) {
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'LUNAS', 'BELUM_LUNAS'
  const [selectedKasbonForSettlement, setSelectedKasbonForSettlement] = useState(null);

  // Default month: Current Year and Month (e.g. '2026-11')
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedExportMonth, setSelectedExportMonth] = useState(currentMonthStr);
  const [exportFeedback, setExportFeedback] = useState(null);

  // Group detail pesanan by id_pesanan for quick lookup
  const detailsByOrderId = useMemo(() => {
    const map = {};
    orderDetails.forEach((d) => {
      if (!map[d.id_pesanan]) map[d.id_pesanan] = [];
      map[d.id_pesanan].push(d);
    });
    return map;
  }, [orderDetails]);

  // Combined transactions with orders
  const combinedTrx = useMemo(() => {
    const orderMap = {};
    orders.forEach((o) => {
      orderMap[o.id_pesanan] = o;
    });

    return transactions.map((t) => {
      const order = orderMap[t.id_pesanan] || {};
      const items = detailsByOrderId[t.id_pesanan] || [];
      return {
        ...t,
        order,
        items
      };
    }).sort((a, b) => new Date(b.tanggal_transaksi) - new Date(a.tanggal_transaksi));
  }, [transactions, orders, detailsByOrderId]);

  // Filtered transactions
  const filteredTrx = useMemo(() => {
    return combinedTrx.filter((item) => {
      if (filterStatus !== 'ALL' && item.status_settlement !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [combinedTrx, filterStatus]);

  // Omzet Metrics calculation
  const metrics = useMemo(() => {
    let totalOmzet = 0;
    let lunasCount = 0;
    let kasbonCount = 0;
    let totalKasbonAmount = 0;
    let totalTunai = 0;
    let totalQris = 0;

    combinedTrx.forEach((item) => {
      const total = Number(item.order.total_akhir) || 0;
      if (item.status_settlement === 'LUNAS') {
        totalOmzet += total;
        lunasCount += 1;
        if (item.kanal_pembayaran === 'QRIS') {
          totalQris += total;
        } else {
          totalTunai += total;
        }
      } else {
        kasbonCount += 1;
        totalKasbonAmount += total;
      }
    });

    const averageOrderValue = lunasCount > 0 ? Math.round(totalOmzet / lunasCount) : 0;
    const tunaiPercentage = totalOmzet > 0 ? Math.round((totalTunai / totalOmzet) * 100) : 0;
    const qrisPercentage = totalOmzet > 0 ? Math.round((totalQris / totalOmzet) * 100) : 0;

    return {
      totalOmzet,
      lunasCount,
      kasbonCount,
      totalKasbonAmount,
      totalTunai,
      totalQris,
      averageOrderValue,
      tunaiPercentage,
      qrisPercentage,
      totalTransactions: combinedTrx.length
    };
  }, [combinedTrx]);

  // Leaderboard Menu Terlaris Calculation
  const leaderboard = useMemo(() => {
    const menuStats = {};

    combinedTrx.forEach((t) => {
      if (t.status_settlement === 'LUNAS') {
        (t.items || []).forEach((item) => {
          const key = item.nama_menu;
          if (!menuStats[key]) {
            menuStats[key] = {
              nama_menu: item.nama_menu,
              totalQty: 0,
              totalRevenue: 0
            };
          }
          menuStats[key].totalQty += item.jumlah;
          menuStats[key].totalRevenue += item.subtotal;
        });
      }
    });

    const list = Object.values(menuStats).sort((a, b) => b.totalQty - a.totalQty);
    const maxQty = list.length > 0 ? list[0].totalQty : 1;

    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
      percentage: Math.round((item.totalQty / maxQty) * 100)
    }));
  }, [combinedTrx]);

  // Handler for Excel Monthly Report Export
  const handleExportExcel = () => {
    try {
      const result = exportMonthlyReportToExcel(transactions, orders, orderDetails, menus, selectedExportMonth);
      if (result.success) {
        setExportFeedback({
          type: 'success',
          text: `✓ Berhasil mengunduh ${result.filename} (${result.count} transaksi)!`
        });
      } else {
        setExportFeedback({
          type: 'error',
          text: result.message
        });
      }
    } catch (err) {
      setExportFeedback({
        type: 'error',
        text: 'Gagal membuat file Excel: ' + (err.message || 'Error tidak diketahui')
      });
    }

    setTimeout(() => setExportFeedback(null), 4000);
  };

  // State for Settlement Modal
  const [settleMethod, setSettleMethod] = useState('Tunai');
  const [settleCash, setSettleCash] = useState(0);

  const openKasbonModal = (trx) => {
    setSelectedKasbonForSettlement(trx);
    setSettleMethod('Tunai');
    setSettleCash(trx.order.total_akhir || 0);
  };

  const handleConfirmSettle = async () => {
    if (!selectedKasbonForSettlement) return;
    const total = selectedKasbonForSettlement.order.total_akhir || 0;
    const numericCash = settleMethod === 'QRIS' ? total : Number(settleCash) || total;

    await onSettleKasbon({
      id_transaksi: selectedKasbonForSettlement.id_transaksi,
      kanal_pembayaran: settleMethod,
      nominal_diterima: numericCash,
      kembalian: settleMethod === 'QRIS' ? 0 : Math.max(0, numericCash - total)
    });

    setSelectedKasbonForSettlement(null);
  };

  const todayDateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="pb-32 pt-2 px-3 space-y-4">
      {/* Header: Date Display */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold mb-0.5">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>{todayDateFormatted}</span>
          </div>
          <h2 className="text-base font-extrabold text-white">Riwayat & Analisa Penjualan</h2>
        </div>

        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg">
          {metrics.totalTransactions} Total Trx
        </span>
      </div>

      {/* Ringkasan Omzet Card */}
      <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl p-4 shadow-pos-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Total Omzet Bersih
            </span>
            <div className="text-2xl font-black text-amber-400 tracking-tight mt-0.5">
              {formatRupiah(metrics.totalOmzet)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full inline-block">
              {metrics.lunasCount} Trx Lunas
            </span>
          </div>
        </div>

        {/* Breakdown Split: Tunai vs QRIS */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
          <div className="bg-zinc-900/80 rounded-xl p-2.5 border border-zinc-800">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium mb-1">
              <span className="flex items-center gap-1">
                <Banknote className="w-3 h-3 text-emerald-400" /> Tunai
              </span>
              <span className="font-mono text-emerald-400 font-bold">{metrics.tunaiPercentage}%</span>
            </div>
            <div className="text-xs font-extrabold text-zinc-200">
              {formatRupiah(metrics.totalTunai)}
            </div>
          </div>

          <div className="bg-zinc-900/80 rounded-xl p-2.5 border border-zinc-800">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium mb-1">
              <span className="flex items-center gap-1">
                <QrCode className="w-3 h-3 text-cyan-400" /> QRIS
              </span>
              <span className="font-mono text-cyan-400 font-bold">{metrics.qrisPercentage}%</span>
            </div>
            <div className="text-xs font-extrabold text-zinc-200">
              {formatRupiah(metrics.totalQris)}
            </div>
          </div>
        </div>
      </div>

      {/* Kontainer Ekspor Laporan Bulanan ke Excel (.xlsx) */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-2xl p-4 shadow-pos-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white">Ekspor Laporan Bulanan (.xlsx)</h3>
              <p className="text-[10px] text-zinc-400">SheetJS Standalone Offline Generator</p>
            </div>
          </div>

          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded">
            2 Sheet
          </span>
        </div>

        {/* Input Bulan & Download Button */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="filter-bulan" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Pilih Periode Bulan:
              </label>
              <input
                type="month"
                id="filter-bulan"
                value={selectedExportMonth}
                onChange={(e) => setSelectedExportMonth(e.target.value)}
                className="w-full bg-zinc-900 text-white font-mono text-xs px-3 py-2 rounded-xl border border-zinc-700 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex-1 pt-4">
              <button
                type="button"
                onClick={handleExportExcel}
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Unduh (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {exportFeedback && (
            <div className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              exportFeedback.type === 'success' 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50' 
                : 'bg-red-950/80 text-red-300 border border-red-500/50'
            }`}>
              <span>{exportFeedback.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Card Piutang Kasbon Pending (If any) */}
      {metrics.kasbonCount > 0 && (
        <div 
          onClick={() => setFilterStatus('BELUM_LUNAS')}
          className="bg-gradient-to-r from-red-950/60 to-zinc-900 border border-red-500/40 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-red-400 transition-all shadow-pos-danger-glow"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0 animate-pulse">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Piutang Kasbon Tertunda</span>
                <span className="text-[10px] font-extrabold bg-red-500 text-white px-1.5 py-0.2 rounded-full">
                  {metrics.kasbonCount}
                </span>
              </div>
              <p className="text-xs font-extrabold text-red-400">
                Total: {formatRupiah(metrics.totalKasbonAmount)}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-red-400 flex items-center gap-1">
            <span>Lunaskan</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      )}

      {/* Analisa Penjualan Toko */}
      <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl p-3.5 shadow-pos-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>Analisa Penjualan Toko</span>
          </h3>
          <span className="text-[10px] text-zinc-500">Performa Kasir</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Rata-rata Trx (AOV)</span>
            <span className="text-sm font-extrabold text-amber-400">
              {formatRupiah(metrics.averageOrderValue)}
            </span>
          </div>

          <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Metode Dominan</span>
            <span className="text-sm font-extrabold text-zinc-200">
              {metrics.totalTunai >= metrics.totalQris ? 'Tunai / Cash' : 'QRIS'}
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Top 5 Menu Terlaris */}
      <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl p-3.5 shadow-pos-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Top 5 Menu Terlaris</span>
          </h3>
          <span className="text-[10px] text-zinc-400 font-semibold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
            Leaderboard
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-4 text-xs text-zinc-500">
            Belum ada penjualan menu yang lunas untuk dihitung.
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((item) => {
              const rankColor = 
                item.rank === 1 ? 'bg-amber-500 text-black font-black' :
                item.rank === 2 ? 'bg-zinc-400 text-black font-black' :
                item.rank === 3 ? 'bg-amber-700 text-white font-black' :
                'bg-zinc-800 text-zinc-400 font-bold';

              return (
                <div key={item.nama_menu} className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] flex-shrink-0 ${rankColor}`}>
                        #{item.rank}
                      </span>
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {item.nama_menu}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-extrabold text-amber-400">
                        {item.totalQty} terjual
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Kontribusi omzet:</span>
                    <span className="font-mono text-zinc-300 font-semibold">{formatRupiah(item.totalRevenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Tabs: Semua, Lunas, Belum Lunas */}
      <div className="grid grid-cols-3 gap-1.5 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 text-xs">
        <button
          type="button"
          onClick={() => setFilterStatus('ALL')}
          className={`py-2 rounded-xl font-bold transition-all ${
            filterStatus === 'ALL'
              ? 'bg-zinc-800 text-white shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Semua ({combinedTrx.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('LUNAS')}
          className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
            filterStatus === 'LUNAS'
              ? 'bg-emerald-600 text-white shadow-pos-success-glow'
              : 'text-zinc-400 hover:text-emerald-400'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>Lunas ({combinedTrx.filter((t) => t.status_settlement === 'LUNAS').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('BELUM_LUNAS')}
          className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
            filterStatus === 'BELUM_LUNAS'
              ? 'bg-red-600 text-white shadow-pos-danger-glow'
              : 'text-zinc-400 hover:text-red-400'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Kasbon ({metrics.kasbonCount})</span>
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        {filteredTrx.length === 0 ? (
          <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl p-8 text-center my-4">
            <Receipt className="w-10 h-10 text-zinc-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-zinc-300">Belum Ada Transaksi</h4>
            <p className="text-xs text-zinc-500 mt-1">
              {filterStatus === 'BELUM_LUNAS'
                ? 'Hebat! Tidak ada tagihan kasbon yang tertunda.'
                : 'Transaksi yang diproses kasir akan tercatat di sini.'}
            </p>
          </div>
        ) : (
          filteredTrx.map((item) => {
            const isLunas = item.status_settlement === 'LUNAS';
            const order = item.order || {};
            const items = item.items || [];

            return (
              <div
                key={item.id_transaksi}
                className={`bg-[#1e1e1e] border rounded-2xl p-3.5 transition-all shadow-pos-card ${
                  !isLunas
                    ? 'border-red-500/50 hover:border-red-400'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header Card: Customer & Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-white truncate">
                      {order.nama_customer || 'Pelanggan'}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {formatTimeOnly(item.tanggal_transaksi)}
                    </p>
                  </div>

                  <div>
                    {isLunas ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        LUNAS
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openKasbonModal(item)}
                        className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full hover:bg-red-500 hover:text-white transition-colors animate-pulse"
                      >
                        <Clock className="w-3 h-3" />
                        BELUM LUNAS
                      </button>
                    )}
                  </div>
                </div>

                {/* Ordered Items Preview */}
                <div className="bg-zinc-900/70 rounded-xl p-2 mb-2.5 text-xs text-zinc-300 space-y-0.5">
                  {items.map((it) => (
                    <div key={it.id_detail} className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-300 truncate">
                        <strong className="text-amber-400">{it.jumlah}x</strong> {it.nama_menu}
                        {it.catatan ? <span className="text-zinc-500 italic"> ({it.catatan})</span> : ''}
                      </span>
                      <span className="text-zinc-400 font-mono ml-2">
                        {formatRupiah(it.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Row: Total, Method & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  <div>
                    <span className="text-[10px] text-zinc-500 block leading-none">Total Tagihan</span>
                    <span className="text-sm font-black text-amber-400">
                      {formatRupiah(order.total_akhir)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Method Badge */}
                    <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-300 px-2 py-1 rounded-lg border border-zinc-700/60">
                      {item.kanal_pembayaran}
                    </span>

                    {/* Settle Kasbon CTA if pending */}
                    {!isLunas && (
                      <button
                        type="button"
                        onClick={() => openKasbonModal(item)}
                        className="bg-red-500 hover:bg-red-400 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md transition-all active:scale-95"
                      >
                        <span>Lunaskan</span>
                        <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Pelunasan Kasbon (dengan QRIS Sederhana) */}
      {selectedKasbonForSettlement && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 animate-fade-in">
          <div className="w-full max-w-md bg-[#18181b] border-t border-zinc-700 rounded-t-3xl p-4 shadow-2xl space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Pelunasan Tagihan Kasbon</h3>
                  <p className="text-[11px] text-zinc-400">
                    {selectedKasbonForSettlement.order?.nama_customer}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedKasbonForSettlement(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
              >
                &times;
              </button>
            </div>

            {/* Kasbon Duration & Info Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Waktu Pemesanan:</span>
                <span className="text-zinc-200 font-medium">
                  {formatDateTime(selectedKasbonForSettlement.tanggal_transaksi)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Durasi Tertunda:</span>
                <span className="text-red-400 font-bold">
                  {getDurationFromNow(selectedKasbonForSettlement.tanggal_transaksi)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-800">
                <span className="text-sm font-bold text-white">Total yang Harus Dilunasi:</span>
                <span className="text-lg font-black text-amber-400">
                  {formatRupiah(selectedKasbonForSettlement.order?.total_akhir)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Metode Pelunasan:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettleMethod('Tunai')}
                  className={`py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    settleMethod === 'Tunai'
                      ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Tunai / Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettleMethod('QRIS')}
                  className={`py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    settleMethod === 'QRIS'
                      ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QRIS (Lunas Pas)</span>
                </button>
              </div>
            </div>

            {/* Tunai Input & Kembalian Calculation */}
            {settleMethod === 'Tunai' ? (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Uang Tunai Diterima:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={settleCash === 0 ? '' : settleCash}
                    onChange={(e) => setSettleCash(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-zinc-900 text-white font-mono font-bold text-lg pl-9 pr-3 py-2 rounded-xl border border-zinc-700 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-between items-center text-xs bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Kembalian:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatRupiah(Math.max(0, (Number(settleCash) || 0) - (selectedKasbonForSettlement.order?.total_akhir || 0)))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-emerald-500/30 p-3 rounded-xl text-center text-xs text-zinc-300">
                <p className="font-semibold text-emerald-400">Pelunasan via QRIS otomatis lunas pas</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Tidak memerlukan input nominal uang tunai.</p>
              </div>
            )}

            {/* Confirm Settlement Button */}
            <button
              type="button"
              onClick={handleConfirmSettle}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-black font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Lunaskan Tagihan Sekarang</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
