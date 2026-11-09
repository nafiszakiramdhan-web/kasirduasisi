import Dexie from 'dexie';

export const db = new Dexie('DuaSisiPOSDatabase');

db.version(1).stores({
  menu: '++id_menu, id_kategori, nama_menu, harga, is_best_seller, is_active',
  pesanan: 'id_pesanan, no_trx, nama_customer, created_at',
  detail_pesanan: 'id_detail, id_pesanan, id_menu',
  transaksi: 'id_transaksi, id_pesanan, status_settlement, kanal_pembayaran, tanggal_transaksi, sync_status, shift'
});

export const INITIAL_MENUS = [
  {
    nama_menu: 'Mont Blanc Twoside',
    id_kategori: 'Signature Dua Sisi',
    deskripsi: 'Signature double espresso dingin dengan topping velvet cream lembut dan sentuhan gula aren.',
    harga: 25000,
    foto_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
    is_best_seller: 1,
    is_active: 1
  },
  {
    nama_menu: 'Aren Latte',
    id_kategori: 'Coffee',
    deskripsi: 'Perpaduan espresso arabika-robusta pilihan dengan susu segar dan sirup gula aren murni khas Dua Sisi.',
    harga: 18000,
    foto_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
    is_best_seller: 1,
    is_active: 1
  },
  {
    nama_menu: 'Caramel Cream Salt',
    id_kategori: 'Signature Dua Sisi',
    deskripsi: 'Cold brew pekat dengan lapisan busa sea salt caramel yang manis gurih menyegarkan.',
    harga: 23000,
    foto_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop&q=80',
    is_best_seller: 1,
    is_active: 1
  },
  {
    nama_menu: 'Black Bitter',
    id_kategori: 'Coffee',
    deskripsi: 'Americano double shot bold dengan crema tebal, aroma roasted nut dan dark chocolate finish.',
    harga: 15000,
    foto_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
    is_best_seller: 0,
    is_active: 1
  },
  {
    nama_menu: 'Tubruk Susu',
    id_kategori: 'Coffee',
    deskripsi: 'Kopi tubruk racikan klasik Nusantara digiling medium, dipadukan manisnya susu kental manis kental.',
    harga: 13000,
    foto_url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&auto=format&fit=crop&q=80',
    is_best_seller: 0,
    is_active: 1
  },
  {
    nama_menu: 'Matcha Ice Blended',
    id_kategori: 'Ice Blended',
    deskripsi: 'Uji matcha Jepang diblender dengan susu creamy, es kristal, dan topping whipped cream manis.',
    harga: 24000,
    foto_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80',
    is_best_seller: 0,
    is_active: 1
  },
  {
    nama_menu: 'Velvet Berry Milk',
    id_kategori: 'Milk Based',
    deskripsi: 'Susu segar dingin berpadu puree stroberi segar dan sari berry alami tanpa kafein.',
    harga: 20000,
    foto_url: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&auto=format&fit=crop&q=80',
    is_best_seller: 0,
    is_active: 1
  },
  {
    nama_menu: 'Lemon Earl Grey',
    id_kategori: 'Non-Coffee',
    deskripsi: 'Seduhan teh hitam Earl Grey bergamot harum dipadu irisan lemon segar penyegar dahaga.',
    harga: 16000,
    foto_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80',
    is_best_seller: 0,
    is_active: 1
  }
];

// Helper to seed initial data if menu table is empty
export async function initDatabase() {
  const count = await db.menu.count();
  if (count === 0) {
    await db.menu.bulkAdd(INITIAL_MENUS);
    console.log('Database seeded with initial menus');
  }
}

// Reset database utility for testing / debugging
export async function resetDatabase() {
  await db.transaction('rw', db.menu, db.pesanan, db.detail_pesanan, db.transaksi, async () => {
    await db.menu.clear();
    await db.pesanan.clear();
    await db.detail_pesanan.clear();
    await db.transaksi.clear();
    await db.menu.bulkAdd(INITIAL_MENUS);
  });
}
