import * as XLSX from 'xlsx';

/**
 * Generate and download an Excel (.xlsx) monthly sales report for Dua Sisi POS
 * with 2 sheets: "Data Transaksi" and "Ringkasan Bulanan".
 * 
 * @param {Array} transactions 
 * @param {Array} orders 
 * @param {Array} orderDetails 
 * @param {Array} menus 
 * @param {string} selectedMonth - Format 'YYYY-MM' (e.g. '2026-11')
 */
export function exportMonthlyReportToExcel(transactions = [], orders = [], orderDetails = [], menus = [], selectedMonth) {
  if (!selectedMonth) {
    const now = new Date();
    selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // 1. Build lookup maps
  const orderMap = {};
  orders.forEach((o) => {
    orderMap[o.id_pesanan] = o;
  });

  const menuCategoryMap = {};
  menus.forEach((m) => {
    menuCategoryMap[m.id_menu] = m.id_kategori || 'Minuman';
    menuCategoryMap[m.nama_menu] = m.id_kategori || 'Minuman';
  });

  const detailsByOrderId = {};
  orderDetails.forEach((d) => {
    if (!detailsByOrderId[d.id_pesanan]) detailsByOrderId[d.id_pesanan] = [];
    detailsByOrderId[d.id_pesanan].push(d);
  });

  // 2. Filter transactions for the selected month (matching YYYY-MM)
  const monthTransactions = transactions.filter((t) => {
    return t.tanggal_transaksi && t.tanggal_transaksi.startsWith(selectedMonth);
  });

  if (monthTransactions.length === 0) {
    return {
      success: false,
      count: 0,
      message: `Tidak ada transaksi yang tercatat pada bulan ${selectedMonth}.`
    };
  }

  // 3. Prepare Sheet 1: "Data Transaksi"
  // Columns: No, ID Transaksi, Tanggal, Jam, Pelanggan, Menu, Kategori, Harga, Qty, Total (Rp), Metode
  const transactionRows = [];
  let rowNumber = 1;

  monthTransactions.forEach((t) => {
    const order = orderMap[t.id_pesanan] || {};
    const items = detailsByOrderId[t.id_pesanan] || [];
    const dateObj = new Date(t.tanggal_transaksi);

    const tanggalStr = dateObj.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const jamStr = dateObj.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const metode = t.kanal_pembayaran || 'Tunai';
    const pelanggan = order.nama_customer || 'Pelanggan';
    const shortTrxId = t.id_transaksi ? t.id_transaksi.slice(0, 8).toUpperCase() : `TRX-${rowNumber}`;

    if (items.length > 0) {
      items.forEach((item) => {
        const kategori = menuCategoryMap[item.id_menu] || menuCategoryMap[item.nama_menu] || 'Minuman';
        transactionRows.push({
          'No': rowNumber++,
          'ID Transaksi': shortTrxId,
          'Tanggal': tanggalStr,
          'Jam': jamStr,
          'Pelanggan': pelanggan,
          'Menu': item.nama_menu,
          'Kategori': kategori,
          'Harga': item.harga_satuan,
          'Qty': item.jumlah,
          'Total (Rp)': item.subtotal,
          'Metode': metode
        });
      });
    } else {
      transactionRows.push({
        'No': rowNumber++,
        'ID Transaksi': shortTrxId,
        'Tanggal': tanggalStr,
        'Jam': jamStr,
        'Pelanggan': pelanggan,
        'Menu': 'Pesanan Kasir',
        'Kategori': 'Umum',
        'Harga': order.total_akhir || 0,
        'Qty': 1,
        'Total (Rp)': order.total_akhir || 0,
        'Metode': metode
      });
    }
  });

  // 4. Prepare Sheet 2: "Ringkasan Bulanan"
  let totalOmzet = 0;
  let totalOmzetTunai = 0;
  let totalOmzetQris = 0;
  let totalLunasCount = 0;

  monthTransactions.forEach((t) => {
    const order = orderMap[t.id_pesanan] || {};
    const total = Number(order.total_akhir) || 0;

    if (t.status_settlement === 'LUNAS') {
      totalOmzet += total;
      totalLunasCount += 1;
      if (t.kanal_pembayaran === 'QRIS') {
        totalOmzetQris += total;
      } else {
        totalOmzetTunai += total;
      }
    }
  });

  const aov = totalLunasCount > 0 ? Math.round(totalOmzet / totalLunasCount) : 0;

  const summaryRows = [
    { 'Indikator Keuangan': 'Periode Laporan', 'Nilai': selectedMonth },
    { 'Indikator Keuangan': 'Total Transaksi Selesai (Lunas)', 'Nilai': `${totalLunasCount} Trx` },
    { 'Indikator Keuangan': 'Total Omzet Keseluruhan', 'Nilai': totalOmzet },
    { 'Indikator Keuangan': 'Total Omzet Tunai / Cash', 'Nilai': totalOmzetTunai },
    { 'Indikator Keuangan': 'Total Omzet QRIS', 'Nilai': totalOmzetQris },
    { 'Indikator Keuangan': 'Rata-rata Nilai Belanja (AOV)', 'Nilai': aov }
  ];

  // 5. Build Workbook using SheetJS
  const wb = XLSX.utils.book_new();

  // Create worksheet for Data Transaksi
  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
  // Set column widths for readability
  wsTransactions['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // ID Transaksi
    { wch: 12 }, // Tanggal
    { wch: 10 }, // Jam
    { wch: 18 }, // Pelanggan
    { wch: 24 }, // Menu
    { wch: 18 }, // Kategori
    { wch: 12 }, // Harga
    { wch: 8 },  // Qty
    { wch: 14 }, // Total (Rp)
    { wch: 12 }  // Metode
  ];

  // Create worksheet for Ringkasan Bulanan
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 32 }, // Indikator
    { wch: 22 }  // Nilai
  ];

  // Append sheets
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Data Transaksi');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Bulanan');

  // 6. Generate file and trigger browser download
  const filename = `Laporan_Kasir_DuaSisi_${selectedMonth}.xlsx`;
  XLSX.writeFile(wb, filename);

  return {
    success: true,
    count: monthTransactions.length,
    filename
  };
}
