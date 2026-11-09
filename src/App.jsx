import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabase } from './db';
import { generateUUID, generateTrxNumber } from './utils/formatters';

// Components
import TopHeader from './components/TopHeader';
import Navbar from './components/Navbar';
import CatalogTab from './components/CatalogTab';
import CartTab from './components/CartTab';
import HistoryTab from './components/HistoryTab';
import MenuAdminTab from './components/MenuAdminTab';
import PaymentModal from './components/PaymentModal';
import PaymentSuccessModal from './components/PaymentSuccessModal';

export default function App() {
  // 1. Live queries from local IndexedDB (Dexie.js)
  const menus = useLiveQuery(() => db.menu.toArray(), []) || [];
  const orders = useLiveQuery(() => db.pesanan.toArray(), []) || [];
  const orderDetails = useLiveQuery(() => db.detail_pesanan.toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transaksi.toArray(), []) || [];

  // Initialize DB seed on startup
  useEffect(() => {
    initDatabase();
  }, []);

  // 2. Navigation State
  const [activeTab, setActiveTab] = useState('catalog');

  // 3. Cart & Order Form State (Customer Name Only)
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');

  // 4. Modals State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [completedPaymentTrx, setCompletedPaymentTrx] = useState(null);

  // 5. Toast Feedback State
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 6. Metrics Calculations
  // Total Omzet Hari Ini (calculated from today's LUNAS transactions)
  const todayRevenue = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const orderMap = {};
    orders.forEach((o) => {
      orderMap[o.id_pesanan] = o;
    });

    return transactions.reduce((sum, t) => {
      const isToday = t.tanggal_transaksi && t.tanggal_transaksi.slice(0, 10) === todayStr;
      if (isToday && t.status_settlement === 'LUNAS') {
        const order = orderMap[t.id_pesanan];
        return sum + (order ? Number(order.total_akhir) || 0 : 0);
      }
      return sum;
    }, 0);
  }, [transactions, orders]);

  // Total Kasbon Count
  const pendingKasbonCount = useMemo(() => {
    return transactions.filter((t) => t.status_settlement === 'BELUM_LUNAS').length;
  }, [transactions]);

  // Cart total items count
  const cartItemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.jumlah, 0);
  }, [cartItems]);

  // ==========================================
  // Cart Actions
  // ==========================================
  const handleAddToCart = (menu) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id_menu === menu.id_menu);
      if (existing) {
        return prev.map((item) =>
          item.id_menu === menu.id_menu
            ? { ...item, jumlah: item.jumlah + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id_menu: menu.id_menu,
          nama_menu: menu.nama_menu,
          foto_url: menu.foto_url,
          harga_satuan: menu.harga,
          jumlah: 1,
          catatan: ''
        }
      ];
    });
    showToast(`+1 ${menu.nama_menu} ditambahkan`);
  };

  const handleUpdateQuantity = (id_menu, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id_menu);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id_menu === id_menu ? { ...item, jumlah: newQty } : item
      )
    );
  };

  const handleUpdateNote = (id_menu, note) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id_menu === id_menu ? { ...item, catatan: note } : item
      )
    );
  };

  const handleRemoveItem = (id_menu) => {
    setCartItems((prev) => prev.filter((item) => item.id_menu !== id_menu));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCustomerName('');
    showToast('Keranjang pesanan dikosongkan');
  };

  // ==========================================
  // Checkout & Payment Handlers (Simplified QRIS & Tunai)
  // ==========================================
  const handleCompletePayment = async (paymentData) => {
    const orderId = generateUUID();
    const trxId = generateUUID();
    const noTrx = generateTrxNumber();
    const nowIso = new Date().toISOString();

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.harga_satuan * item.jumlah,
      0
    );
    const totalAkhir = paymentData.totalAmount;

    // 1. Prepare Order Record (customer name only)
    const orderRecord = {
      id_pesanan: orderId,
      no_trx: noTrx,
      nama_customer: paymentData.customerName || 'Customer',
      nomor_meja: '',
      tipe_layanan: 'Order Langsung',
      subtotal,
      total_akhir: totalAkhir,
      created_at: nowIso
    };

    // 2. Prepare Detail Items Records
    const detailRecords = cartItems.map((item) => ({
      id_detail: generateUUID(),
      id_pesanan: orderId,
      id_menu: item.id_menu,
      nama_menu: item.nama_menu,
      jumlah: item.jumlah,
      harga_satuan: item.harga_satuan,
      subtotal: item.harga_satuan * item.jumlah,
      catatan: item.catatan || ''
    }));

    // 3. Prepare Transaction Record (no shift / cashier labels)
    const trxRecord = {
      id_transaksi: trxId,
      id_pesanan: orderId,
      kasir_pencatat: 'Kasir',
      shift: 'Reguler',
      status_settlement: paymentData.settlementStatus, // 'LUNAS' | 'BELUM_LUNAS'
      kanal_pembayaran: paymentData.paymentChannel, // 'Tunai' | 'QRIS'
      nominal_diterima: paymentData.cashReceived,
      kembalian: paymentData.changeAmount,
      tanggal_transaksi: nowIso,
      sync_status: 'synced'
    };

    // Atomic write to Dexie.js
    await db.transaction('rw', db.pesanan, db.detail_pesanan, db.transaksi, async () => {
      await db.pesanan.add(orderRecord);
      await db.detail_pesanan.bulkAdd(detailRecords);
      await db.transaksi.add(trxRecord);
    });

    // Close Payment Modal & Clear Cart
    setIsPaymentOpen(false);
    setCartItems([]);
    setCustomerName('');

    // Open Payment Success Modal (showing change amount & customer name)
    const completeTrxData = {
      ...trxRecord,
      order: orderRecord,
      items: detailRecords
    };
    setCompletedPaymentTrx(completeTrxData);

    showToast(
      paymentData.settlementStatus === 'LUNAS'
        ? `✓ Pembayaran ${paymentData.paymentChannel} selesai!`
        : '⚠️ Dicatat sebagai Kasbon pending'
    );
  };

  // ==========================================
  // Pelunasan Kasbon Handlers
  // ==========================================
  const handleSettleKasbon = async ({ id_transaksi, kanal_pembayaran, nominal_diterima, kembalian }) => {
    await db.transaksi.update(id_transaksi, {
      status_settlement: 'LUNAS',
      kanal_pembayaran,
      nominal_diterima,
      kembalian,
      sync_status: 'synced'
    });

    showToast('✓ Tagihan kasbon berhasil DILUNASKAN!');
  };

  // ==========================================
  // Menu Admin Handlers
  // ==========================================
  const handleSaveMenu = async (menuData) => {
    if (menuData.id_menu) {
      await db.menu.update(menuData.id_menu, menuData);
      showToast(`Menu "${menuData.nama_menu}" diperbarui`);
    } else {
      await db.menu.add(menuData);
      showToast(`Menu baru "${menuData.nama_menu}" ditambahkan`);
    }
  };

  const handleDeleteMenu = async (id_menu) => {
    await db.menu.delete(id_menu);
    showToast('Menu berhasil dihapus dari katalog');
  };

  const handleToggleMenuActive = async (id_menu, newStatus) => {
    await db.menu.update(id_menu, { is_active: newStatus ? 1 : 0 });
    showToast(`Status menu: ${newStatus ? 'Ready di Kasir' : 'Habis'}`);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex justify-center">
      {/* Mobile Portrait Frame (412px target width) */}
      <div className="w-full max-w-md min-h-screen bg-[#121212] flex flex-col relative border-x border-zinc-900 shadow-2xl">
        {/* Top Header Bar */}
        <TopHeader
          todayRevenue={todayRevenue}
        />

        {/* Tab Content */}
        <main className="flex-1 flex flex-col">
          {activeTab === 'catalog' && (
            <CatalogTab
              menus={menus}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onViewCart={() => setActiveTab('cart')}
            />
          )}

          {activeTab === 'cart' && (
            <CartTab
              cartItems={cartItems}
              customerName={customerName}
              setCustomerName={setCustomerName}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateNote={handleUpdateNote}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onBackToCatalog={() => setActiveTab('catalog')}
              onProceedToPayment={() => setIsPaymentOpen(true)}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              orders={orders}
              transactions={transactions}
              orderDetails={orderDetails}
              menus={menus}
              onSettleKasbon={handleSettleKasbon}
            />
          )}

          {activeTab === 'menu' && (
            <MenuAdminTab
              menus={menus}
              onSaveMenu={handleSaveMenu}
              onDeleteMenu={handleDeleteMenu}
              onToggleActive={handleToggleMenuActive}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cartCount={cartItemCount}
          pendingKasbonCount={pendingKasbonCount}
        />

        {/* Payment Bottom Sheet Modal */}
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          cartItems={cartItems}
          customerName={customerName}
          onCompletePayment={handleCompletePayment}
        />

        {/* Payment Success Modal */}
        <PaymentSuccessModal
          isOpen={!!completedPaymentTrx}
          onClose={() => {
            setCompletedPaymentTrx(null);
            setActiveTab('catalog');
          }}
          transaction={completedPaymentTrx}
        />

        {/* Toast Notification Pill */}
        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-xs bg-zinc-900/95 border border-amber-500/50 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl backdrop-blur flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
