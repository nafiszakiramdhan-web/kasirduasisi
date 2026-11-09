-- ====================================================================
-- DATABASE SCHEMA: SISTEM KASIR COFFEE SHOP DUA SISI
-- Kelompok 6 - Berdasarkan Class Diagram & ERD Resmi
-- ====================================================================

-- 1. TABEL MENU
-- Menyimpan master katalog menu, kategori produk, dan harga satuan
CREATE TABLE IF NOT EXISTS menu (
    id_menu INT AUTO_INCREMENT PRIMARY KEY,
    nama_menu VARCHAR(100) NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    harga DECIMAL(12, 2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABEL PESANAN
-- Menyimpan pesanan dari customer yang terhubung ke menu
CREATE TABLE IF NOT EXISTS pesanan (
    id_pesanan INT AUTO_INCREMENT PRIMARY KEY,
    nama_customer VARCHAR(100) NOT NULL,
    id_menu INT NOT NULL,
    jumlah INT NOT NULL,
    total_harga DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_pesanan_menu 
        FOREIGN KEY (id_menu) REFERENCES menu(id_menu) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABEL TRANSAKSI
-- Mencatat penyelesaian pembayaran, nominal bayar, kembalian, dan metode bayar
CREATE TABLE IF NOT EXISTS transaksi (
    id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
    id_pesanan INT NOT NULL,
    tanggal_transaksi DATETIME NOT NULL,
    nominal_bayar DECIMAL(12, 2) NOT NULL,
    kembalian DECIMAL(12, 2) NOT NULL,
    metode_pembayaran VARCHAR(50) NOT NULL,
    CONSTRAINT fk_transaksi_pesanan 
        FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- SEED DATA MENU AWAL (COFFEE SHOP DUA SISI)
-- ====================================================================
INSERT INTO menu (nama_menu, kategori, harga) VALUES
('Mont Blanc Twoside', 'Signature Dua Sisi', 25000.00),
('Aren Latte', 'Coffee', 18000.00),
('Caramel Cream Salt', 'Signature Dua Sisi', 23000.00),
('Black Bitter', 'Coffee', 15000.00),
('Tubruk Susu', 'Coffee', 13000.00);