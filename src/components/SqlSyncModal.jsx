import React, { useState, useMemo } from 'react';
import { X, Database, CheckCircle, RefreshCw, Copy, Download, Code, Sparkles, HardDrive } from 'lucide-react';
import { formatRupiah, formatDateTime } from '../utils/formatters';

export default function SqlSyncModal({
  isOpen,
  onClose,
  orders = [],
  transactions = [],
  orderDetails = [],
  onMarkAllSynced,
  onResetDb
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('sql'); // 'sql' or 'db'
  const [copied, setCopied] = useState(false);

  // Filter pending sync
  const pendingTransactions = useMemo(() => {
    return transactions.filter((t) => t.sync_status === 'pending');
  }, [transactions]);

  // Generate SQL insert queries compliant with skema_database_sql_kasir_dua_sisi.sql
  const generatedSql = useMemo(() => {
    let sql = `-- ====================================================================\n`;
    sql += `-- SQL DATA SINKRONISASI OFFLINE POS DUA SISI\n`;
    sql += `-- Dihasilkan pada: ${new Date().toISOString()}\n`;
    sql += `-- Sesuai Skema: skema_database_sql_kasir_dua_sisi.sql (Kelompok 6)\n`;
    sql += `-- ====================================================================\n\n`;

    if (transactions.length === 0) {
      sql += `-- Belum ada data transaksi yang dapat diekspor ke SQL.\n`;
      return sql;
    }

    const orderMap = {};
    orders.forEach((o) => {
      orderMap[o.id_pesanan] = o;
    });

    // 1. Pesanan Inserts
    sql += `-- 1. INSERT TABEL PESANAN & DETAIL\n`;
    orders.forEach((o, index) => {
      // Find first item or representative menu
      const items = orderDetails.filter((d) => d.id_pesanan === o.id_pesanan);
      const firstMenuId = items[0]?.id_menu || 1;
      const totalQty = items.reduce((s, i) => s + i.jumlah, 0) || 1;

      sql += `INSERT INTO pesanan (nama_customer, id_menu, jumlah, total_harga) VALUES ('${o.nama_customer.replace(/'/g, "''")}', ${firstMenuId}, ${totalQty}, ${o.total_akhir});\n`;
    });

    sql += `\n-- 2. INSERT TABEL TRANSAKSI\n`;
    transactions.forEach((t, index) => {
      const order = orderMap[t.id_pesanan] || {};
      const dateFormatted = new Date(t.tanggal_transaksi).toISOString().slice(0, 19).replace('T', ' ');
      const nominal = t.nominal_diterima || order.total_akhir || 0;
      const change = t.kembalian || 0;
      const method = t.kanal_pembayaran || 'Tunai';

      sql += `INSERT INTO transaksi (id_pesanan, tanggal_transaksi, nominal_bayar, kembalian, metode_pembayaran) VALUES (${index + 1}, '${dateFormatted}', ${nominal}, ${change}, '${method}');\n`;
    });

    return sql;
  }, [transactions, orders, orderDetails]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(generatedSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([generatedSql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `duasisi_pos_export_${Date.now()}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 animate-fade-in">
      <div className="w-full max-w-md bg-[#18181b] border border-zinc-700 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Sinkronisasi & SQL Bridge</h3>
              <p className="text-[11px] text-zinc-400">Arsitektur Offline Dexie ke Server SQL</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Status Cards */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
            <span className="text-[10px] text-zinc-400 font-semibold block">Antrean Offline:</span>
            <span className="text-base font-extrabold text-amber-400">
              {pendingTransactions.length} Pending
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
            <span className="text-[10px] text-zinc-400 font-semibold block">Tersinkron ke SQL:</span>
            <span className="text-base font-extrabold text-emerald-400">
              {transactions.length - pendingTransactions.length} Synced
            </span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-3 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'sql'
                ? 'bg-amber-500 text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Skema SQL Export</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('db')}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'db'
                ? 'bg-amber-500 text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Status Dexie DB</span>
          </button>
        </div>

        {/* Content Tab 1: SQL Code View */}
        {activeTab === 'sql' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
            <div className="flex-1 bg-black/90 border border-zinc-800 rounded-xl p-3 font-mono text-[11px] text-zinc-300 overflow-y-auto select-text shadow-inner">
              <pre className="whitespace-pre-wrap">{generatedSql}</pre>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSql}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh .sql</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Tab 2: IndexedDB Diagnostics */}
        {activeTab === 'db' && (
          <div className="flex-1 overflow-y-auto space-y-3 text-xs">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-2">
              <h4 className="font-bold text-zinc-200 uppercase text-[11px] tracking-wider">
                Tabel Lokal IndexedDB (Dexie.js):
              </h4>
              <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                <li className="flex justify-between">
                  <span>db.menu:</span>
                  <span className="font-mono text-zinc-200 font-bold">Tersimpan lokal di HP</span>
                </li>
                <li className="flex justify-between">
                  <span>db.pesanan:</span>
                  <span className="font-mono text-zinc-200 font-bold">{orders.length} record</span>
                </li>
                <li className="flex justify-between">
                  <span>db.detail_pesanan:</span>
                  <span className="font-mono text-zinc-200 font-bold">{orderDetails.length} record</span>
                </li>
                <li className="flex justify-between">
                  <span>db.transaksi:</span>
                  <span className="font-mono text-zinc-200 font-bold">{transactions.length} record</span>
                </li>
              </ul>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-2">
              <h4 className="font-bold text-zinc-200 uppercase text-[11px] tracking-wider">
                Aksi Database Pengujian:
              </h4>
              <button
                type="button"
                onClick={onResetDb}
                className="w-full bg-red-950/40 hover:bg-red-900/50 text-red-400 font-bold py-2 rounded-xl border border-red-500/30 text-xs transition-colors"
              >
                Reset Database ke Data Awal Seed
              </button>
            </div>
          </div>
        )}

        {/* Sync Trigger CTA */}
        <div className="pt-3 mt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onMarkAllSynced}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4 stroke-[2.5]" />
            <span>Simulasikan Sinkronisasi ke Server SQL Selesai</span>
          </button>
        </div>
      </div>
    </div>
  );
}
