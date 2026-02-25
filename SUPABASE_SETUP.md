# 🚀 Panduan Setup Supabase untuk Patungan App

Dokumen ini berisi langkah-langkah lengkap untuk setup Supabase dan konfigurasi di aplikasi Patungan.

---

## ✅ Step-by-Step Setup

### **Step 1: Daftar di Supabase**

1. Buka website [supabase.com](https://supabase.com)
2. Klik tombol **"Sign Up"**
3. Pilih metode login:
   - Email & Password, atau
   - GitHub account (disarankan untuk kemudahan)
4. Verifikasi email Anda (jika menggunakan email)

---

### **Step 2: Buat Project Baru**

1. Setelah login di dashboard Supabase, klik **"New Project"**
2. Isi form dengan detail:
   - **Project Name**: `patungan` (atau nama sesuai preferensi)
   - **Database Password**: Buat password yang **SANGAT KUAT** dan simpan di tempat aman!
     - Contoh: `Patungan@2024$uPabase#Secure`
   - **Region**: Pilih `Asia Southeast 1 (Singapore)` - terdekat dengan Indonesia
   - **Pricing Plan**: Pilih `Free` (gratis, cukup untuk development)
3. Klik **"Create New Project"**
4. Tunggu 1-2 menit hingga project selesai dibuat

---

### **Step 3: Buat Database Tables**

1. Di dashboard Supabase, buka sidebar kiri
2. Klik **"SQL Editor"** (ikon `>_`)
3. Klik tombol **"New Query"**
4. Copy-paste SQL script berikut:

```sql
-- Table untuk Simple Split Bill
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL UNIQUE,
  bill_name VARCHAR(255),
  total_bill DECIMAL(12, 2),
  enable_service BOOLEAN DEFAULT true,
  enable_tax BOOLEAN DEFAULT true,
  custom_service VARCHAR(255),
  custom_tax VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table untuk People dalam Simple Split
CREATE TABLE bill_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  person_id VARCHAR(255) NOT NULL,
  person_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table untuk Custom Split Bill
CREATE TABLE custom_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL UNIQUE,
  enable_service BOOLEAN DEFAULT true,
  enable_tax BOOLEAN DEFAULT true,
  custom_service VARCHAR(255),
  custom_tax VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table untuk People dalam Custom Split
CREATE TABLE custom_bill_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_bill_id UUID REFERENCES custom_bills(id) ON DELETE CASCADE,
  person_id VARCHAR(255) NOT NULL,
  person_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table untuk Items dalam Custom Split
CREATE TABLE custom_bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_bill_id UUID REFERENCES custom_bills(id) ON DELETE CASCADE,
  item_id VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table untuk assigned items per person
CREATE TABLE custom_bill_item_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES custom_bill_items(id) ON DELETE CASCADE,
  person_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table untuk Catatan
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  content TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table untuk User Identity / Sessions
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

5. Klik **"Run"** atau tekan keyboard shortcut yang ditampilkan
6. Tunggu hingga semua tables berhasil dibuat (akan ada konfirmasi di layar)

---

### **Step 4: Ambil API Keys**

1. Buka menu **"Settings"** di sidebar kiri
2. Klik tab **"API"**
3. Di bagian **"Project API keys"**, Anda akan melihat 2 key penting:
   - **Project URL** - copy dan simpan
   - **anon public** - copy dan simpan (ini API key publik)

**Contoh:**

```
URL: https://xyzabc123.supabase.co
ANON KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **PENTING**: Jangan share key-key ini ke publik atau push ke GitHub!

---

### **Step 5: Setup Environment Variables**

Saya sudah membuat file `.env` di project. Sekarang Anda perlu mengisinya:

1. Buka file `.env` di root project
2. Ganti placeholder dengan key yang sudah Anda copy:

```env
VITE_GEMINI_API_KEY=AIzaSyAj_uf9KYHaetbEHU0-sPBu3Edess9CdYM

# Supabase Configuration
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save file (Ctrl+S / Cmd+S)

---

### **Step 6: Install Dependencies**

Dependencies sudah diinstall. Namun, jika belum, jalankan:

```bash
npm install
```

---

### **Step 7: Test Koneksi**

1. Jalankan dev server:

```bash
npm run dev
```

2. Buka aplikasi di browser (biasanya `http://localhost:5173`)

3. Coba buat split bill baru:
   - Buat bill baru dengan judul yang unik
   - Tambahkan beberapa orang
   - Masukkan total bill
   - Refresh page (Ctrl+R / Cmd+R)
   - **Jika data masih ada = Supabase bekerja! ✅**

---

## 📊 Struktur Database yang Dibuat

### **Tabel: `bills`**

Menyimpan informasi simple split bill

| Column         | Type      | Keterangan                 |
| -------------- | --------- | -------------------------- |
| id             | UUID      | Primary Key                |
| title          | VARCHAR   | Judul bill (unique)        |
| bill_name      | VARCHAR   | Nama bill yang ditampilkan |
| total_bill     | DECIMAL   | Total nominal              |
| enable_service | BOOLEAN   | Apakah service aktif       |
| enable_tax     | BOOLEAN   | Apakah pajak aktif         |
| custom_service | VARCHAR   | Nilai service custom       |
| custom_tax     | VARCHAR   | Nilai pajak custom         |
| created_at     | TIMESTAMP | Waktu dibuat               |
| updated_at     | TIMESTAMP | Waktu terakhir diupdate    |

### **Tabel: `bill_people`**

Menyimpan daftar orang dalam simple split

| Column      | Type      | Keterangan           |
| ----------- | --------- | -------------------- |
| id          | UUID      | Primary Key          |
| bill_id     | UUID      | Foreign Key ke bills |
| person_id   | VARCHAR   | ID unik orang        |
| person_name | VARCHAR   | Nama orang           |
| created_at  | TIMESTAMP | Waktu ditambahkan    |

### **Tabel: `custom_bills`**

Menyimpan informasi custom split bill

### **Tabel: `custom_bill_people`**

Menyimpan daftar orang dalam custom split

### **Tabel: `custom_bill_items`**

Menyimpan daftar item dalam custom split

### **Tabel: `custom_bill_item_assignments`**

Menyimpan relasi antara item dan orang yang mengonsumsi

---

## 🛠️ Code Changes yang Sudah Dilakukan

Saya sudah mengupdate beberapa file untuk menggunakan Supabase:

### 1. **`src/lib/supabase.ts`** (FILE BARU)

- File konfigurasi utama untuk koneksi Supabase
- Berisi semua fungsi untuk CRUD operasi
- Digunakan oleh component-component lain

### 2. **`src/pages/SplitBill.tsx`** (UPDATED)

- Menggunakan `loadBillFromSupabase()` untuk load data
- Menggunakan `saveBillToSupabase()` untuk menyimpan data
- Menggunakan `deleteBillFromSupabase()` untuk hapus data

### 3. **`src/pages/Index.tsx`** (UPDATED)

- Sama seperti SplitBill.tsx tapi untuk custom split
- Menggunakan `loadCustomBillFromSupabase()`
- Menggunakan `saveCustomBillToSupabase()`
- Menggunakan `deleteCustomBillFromSupabase()`

---

## 🔐 Security Notes

⚠️ **PENTING:**

1. **Jangan share** API keys ke GitHub atau tempat publik
2. `.env` file sudah ada di `.gitignore` (jadi aman)
3. Gunakan "anon" key untuk frontend (sudah dibuat keamanan default di Supabase)
4. Untuk production, aktifkan Row Level Security (RLS) di Supabase dashboard

---

## 🐛 Troubleshooting

### Problem: "Supabase credentials not found"

**Solusi:**

- Pastikan `.env` file memiliki `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
- Restart dev server setelah mengubah `.env`

### Problem: "cannot find table"

**Solusi:**

- Pastikan SQL queries di Step 3 sudah dijalankan
- Buka Supabase dashboard → Table Editor. Cek apakah tables sudah ada

### Problem: Data tidak tersimpan ke Supabase

**Solusi:**

- Buka browser console (F12) dan lihat error messages
- Pastikan internet terhubung
- Cek API keys di `.env` sudah benar

### Problem: CORS error

**Solusi:**

- Di Supabase dashboard, buka Settings → API
- Pastikan domain Anda sudah ada di "CORS"
- Untuk localhost, seharusnya sudah default

---

## 📚 Referensi Tambahan

- **Supabase Docs**: https://supabase.com/docs
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript/introduction
- **Database Concepts**: https://supabase.com/docs/guides/database

---

## ✨ Langkah Selanjutnya (Optional)

1. **Authentication**: Tambahkan user login/register
2. **Sharing**: Implementasi sharing bill ke teman via link
3. **Notifications**: Real-time notifications ketika orang lain update bill

---

**Selamat! Patungan app Anda sekarang menggunakan Supabase! 🎉**

Jika ada pertanyaan atau error, cek console di browser untuk melihat error details.
