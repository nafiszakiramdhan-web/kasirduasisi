import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  Camera, 
  Image as ImageIcon, 
  UtensilsCrossed, 
  Upload,
  RefreshCw
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { compressImageFile } from '../utils/imageCompressor';

const DEFAULT_CATEGORIES = [
  'Signature Dua Sisi',
  'Coffee',
  'Milk Based',
  'Ice Blended',
  'Non-Coffee'
];

export default function MenuAdminTab({
  menus = [],
  onSaveMenu,
  onDeleteMenu,
  onToggleActive
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Hidden File Input Refs
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Form Fields
  const [formData, setFormData] = useState({
    nama_menu: '',
    id_kategori: 'Signature Dua Sisi',
    deskripsi: '',
    harga: '',
    foto_url: '',
    is_best_seller: 0,
    is_active: 1
  });

  // Filtered menus
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      if (categoryFilter !== 'Semua' && menu.id_kategori !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          menu.nama_menu.toLowerCase().includes(q) ||
          (menu.id_kategori || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [menus, categoryFilter, searchQuery]);

  const activeCount = menus.filter((m) => m.is_active === 1).length;

  const handleOpenAdd = () => {
    setEditingMenu(null);
    setFormData({
      nama_menu: '',
      id_kategori: 'Signature Dua Sisi',
      deskripsi: '',
      harga: '',
      foto_url: '',
      is_best_seller: 0,
      is_active: 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({
      nama_menu: menu.nama_menu,
      id_kategori: menu.id_kategori,
      deskripsi: menu.deskripsi || '',
      harga: menu.harga,
      foto_url: menu.foto_url || '',
      is_best_seller: menu.is_best_seller || 0,
      is_active: menu.is_active !== undefined ? menu.is_active : 1
    });
    setIsModalOpen(true);
  };

  // Process and compress image from Camera or Gallery
  const handleImageFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      // Compress with Canvas: max 400x400 px JPEG at 0.8 quality
      const base64DataUrl = await compressImageFile(file, 400, 400, 0.8);
      setFormData((prev) => ({ ...prev, foto_url: base64DataUrl }));
    } catch (err) {
      alert(err.message || 'Gagal memproses gambar.');
    } finally {
      setIsCompressing(false);
      // Reset input value so re-taking photo works
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama_menu.trim() || !formData.harga) {
      alert('Nama menu dan harga wajib diisi!');
      return;
    }

    const payload = {
      ...(editingMenu ? { id_menu: editingMenu.id_menu } : {}),
      nama_menu: formData.nama_menu.trim(),
      id_kategori: formData.id_kategori,
      deskripsi: formData.deskripsi.trim(),
      harga: Number(formData.harga) || 0,
      foto_url: formData.foto_url.trim() || '/assets/logoduasisi.jpg',
      is_best_seller: formData.is_best_seller ? 1 : 0,
      is_active: formData.is_active ? 1 : 0
    };

    onSaveMenu(payload);
    setIsModalOpen(false);
  };

  const handleDeleteClick = (menu) => {
    if (window.confirm(`Hapus menu "${menu.nama_menu}" dari katalog?`)) {
      onDeleteMenu(menu.id_menu);
    }
  };

  return (
    <div className="pb-32 pt-2 px-3">
      {/* Top Admin Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 block">
            {menus.length} Total Menu • <span className="text-emerald-400 font-bold">{activeCount} Ready di Kasir</span>
          </span>
          <h2 className="text-base font-extrabold text-white">Kelola Menu & Stok</h2>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Menu</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari menu untuk diubah / atur stok..."
          className="w-full bg-zinc-900 text-white pl-9 pr-8 py-2 rounded-xl border border-zinc-800 text-xs focus:border-amber-500 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3 -mx-3 px-3">
        {['Semua', ...DEFAULT_CATEGORIES].map((cat) => {
          const isSelected = categoryFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all ${
                isSelected
                  ? 'bg-amber-500 text-black border-amber-500 font-bold'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Menu List */}
      <div className="space-y-2.5">
        {filteredMenus.length === 0 ? (
          <div className="bg-[#1e1e1e] border border-zinc-800 rounded-2xl p-6 text-center">
            <UtensilsCrossed className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">Tidak ada menu yang sesuai dengan filter.</p>
          </div>
        ) : (
          filteredMenus.map((menu) => {
            const isActive = menu.is_active === 1;

            return (
              <div
                key={menu.id_menu}
                className={`bg-[#1e1e1e] border rounded-2xl p-3 shadow-pos-card transition-all ${
                  isActive ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Photo thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl bg-zinc-900 overflow-hidden flex-shrink-0 border border-zinc-800">
                    <img
                      src={menu.foto_url || '/assets/logoduasisi.jpg'}
                      alt={menu.nama_menu}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/logoduasisi.jpg';
                      }}
                    />
                    {menu.is_best_seller === 1 && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-black p-0.5 rounded-full shadow">
                        <Sparkles className="w-2.5 h-2.5 fill-black" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-white truncate">
                        {menu.nama_menu}
                      </h4>
                      {menu.is_best_seller === 1 && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30">
                          BEST
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">{menu.id_kategori}</p>
                    <p className="text-xs font-black text-amber-400 mt-0.5">
                      {formatRupiah(menu.harga)}
                    </p>
                  </div>

                  {/* Action buttons (Edit & Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(menu)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                      title="Edit Menu"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(menu)}
                      className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 transition-colors"
                      title="Hapus Menu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Toggle Bar */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-800/70">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 font-medium">Status Kasir:</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {isActive ? 'READY / TERSEDIA' : 'HABIS / NON-AKTIF'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleActive(menu.id_menu, !isActive)}
                    className={`text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1 ${
                      isActive
                        ? 'bg-zinc-800 hover:bg-red-950/40 text-zinc-300 hover:text-red-400 border border-zinc-700'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-pos-success-glow'
                    }`}
                  >
                    <span>{isActive ? 'Tandai Habis' : 'Aktifkan'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Form Tambah / Edit Menu dengan Kamera & Galeri */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#18181b] border border-zinc-700 rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-base text-white">
                {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Photo Upload: Kamera HP & Galeri File */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Foto Produk Minuman:
                </label>

                {/* Hidden File Inputs for Camera and Gallery */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {/* Real-time Image Preview */}
                <div className="flex items-center gap-3 bg-zinc-900 p-2.5 rounded-2xl border border-zinc-800 mb-2">
                  <div className="relative w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {formData.foto_url ? (
                      <img
                        src={formData.foto_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-zinc-600" />
                    )}

                    {isCompressing && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-amber-400">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-200 truncate">
                      {formData.foto_url.startsWith('data:image') 
                        ? '✓ Foto Tersimpan (Terkonversi Base64)' 
                        : formData.foto_url ? 'Foto dari URL' : 'Belum Ada Foto'}
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                      Kompresi otomatis Canvas (max 400x400 px JPEG) agar IndexedDB tetap ringan.
                    </p>
                    {formData.foto_url && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, foto_url: '' })}
                        className="text-[10px] font-bold text-red-400 hover:underline mt-1 block"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>

                {/* 2 Upload Buttons: Kamera & Galeri */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressing}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Kamera HP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isCompressing}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Galeri HP</span>
                  </button>
                </div>
              </div>

              {/* Nama Menu */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Nama Menu <span className="text-red-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_menu}
                  onChange={(e) => setFormData({ ...formData, nama_menu: e.target.value })}
                  placeholder="Contoh: Sea Salt Macchiato"
                  className="w-full bg-zinc-900 text-white text-sm px-3.5 py-2 rounded-xl border border-zinc-700 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Kategori Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Kategori Menu:
                </label>
                <select
                  value={formData.id_kategori}
                  onChange={(e) => setFormData({ ...formData, id_kategori: e.target.value })}
                  className="w-full bg-zinc-900 text-white text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 focus:border-amber-500 focus:outline-none"
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harga Input */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Harga Satuan (Rp) <span className="text-red-400">*</span>:
                </label>
                <input
                  type="number"
                  required
                  value={formData.harga}
                  onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                  placeholder="25000"
                  className="w-full bg-zinc-900 text-white text-sm px-3.5 py-2 rounded-xl border border-zinc-700 focus:border-amber-500 focus:outline-none font-mono font-bold"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Deskripsi / Komposisi:
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  rows={2}
                  placeholder="Deskripsi singkat rasa dan racikan..."
                  className="w-full bg-zinc-900 text-white text-xs px-3.5 py-2 rounded-xl border border-zinc-700 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Toggle Switches: Best Seller & Active */}
              <div className="pt-1 space-y-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-zinc-200">Jadikan Best Seller</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_best_seller === 1}
                    onChange={(e) =>
                      setFormData({ ...formData, is_best_seller: e.target.checked ? 1 : 0 })
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-zinc-200">Status Ready di Kasir</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })
                    }
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="w-full bg-amber-500 hover:bg-amber-400 active:scale-98 text-black font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  Simpan Perubahan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
