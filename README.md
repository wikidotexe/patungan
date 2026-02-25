# 💰 Patungan

**Bagi tagihan dengan mudah • Data tersimpan di cloud • AI Assistant**

Aplikasi web untuk membagi tagihan dengan teman-teman secara mudah dan akurat. Mendukung perhitungan pajak, service charge, pembagian custom per item, user session berbasis email, dan asisten AI terintegrasi.

---

## ✨ Fitur Utama

- 👤 **User Session** - Masukkan nama & email sekali, data tersimpan di cloud dan sync antar device
- 🧮 **Split Bill Otomatis** - Bagi tagihan secara merata dengan perhitungan pajak & service otomatis
- 🎯 **Custom Split Bill** - Tentukan siapa yang bayar item apa (Ekspor PDF & Share WA)
- 📝 **Catatan (Notes)** - Catat daftar belanja atau rencana trip dengan fitur reorder — tersimpan di Supabase
- 🤖 **Patungan AI** - Asisten cerdas bertenaga Gemini 2.5 Flash Lite, riwayat chat tersimpan di cloud
- 📊 **Ringkasan Detail** - Lihat breakdown pembayaran per orang secara transparan
- 📱 **Mobile Responsive** - Tampilan optimal di semua perangkat
- 📤 **Share ke WhatsApp** - Bagikan hasil perhitungan langsung ke WhatsApp
- 📋 **Copy to Clipboard** - Salin ringkasan pembayaran dengan satu klik

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 atau lebih tinggi)
- npm atau bun
- Akun [Supabase](https://supabase.com)

### Installation

```bash
# Clone repository
git clone <YOUR_GIT_URL>

# Masuk ke direktori project
cd patungan

# Install dependencies
npm install

# Konfigurasi Environment Variables
cp .env.example .env
```

Tambahkan variabel berikut di file `.env`:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GEMINI_API_KEY=AIzaSy...
```

### Setup Database (Supabase)

Jalankan SQL berikut di **Supabase Dashboard → SQL Editor** (lihat `SUPABASE_SETUP.md` untuk skema lengkap):

```sql
-- Tabel existing (Split Bill)
CREATE TABLE bills ( ... );
CREATE TABLE bill_people ( ... );
CREATE TABLE custom_bills ( ... );
-- ... (lihat SUPABASE_SETUP.md)

-- Tabel baru
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  content TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Running Locally

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8080`

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool & Dev Server |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI Components |
| **Framer Motion** | Animations & Transitions |
| **Supabase** | Database & Cloud Storage |
| **Gemini AI** | AI Engine (Gemini 2.5 Flash Lite) |
| **Next-Themes** | Dark Mode Support |
| **Lucide React** | Icons |
| **html2pdf.js** | PDF Export |

---

## 📦 Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## 📁 Project Structure

```
patungan/
├── src/
│   ├── components/     # Reusable UI components (ChatAI, UserSetupDialog, ...)
│   ├── pages/          # Page components (Home, SplitBill, Notes, ...)
│   ├── lib/            # Utility functions (supabase.ts, userStore.ts, ...)
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── SUPABASE_SETUP.md   # Panduan setup database Supabase
└── dist/               # Build output
```

---

## 🎨 Features in Detail

### 👤 User Session
- Popup muncul saat pertama kali buka aplikasi
- Input nama & email → disimpan ke Supabase `users` table
- Sesi di-cache di localStorage agar tidak perlu login ulang
- Klik ikon inisial (pojok kanan atas) untuk lihat profil atau keluar sesi

### 🧮 Split Bill
Bagi tagihan secara merata:
- Input jumlah teman, total tagihan
- Perhitungan otomatis pajak & service
- Ringkasan per orang, share ke WhatsApp

### 🎯 Custom Split Bill
Kontrol penuh siapa bayar apa:
- Assign item ke orang tertentu
- Satu item bisa dibagi beberapa orang
- Perhitungan proporsional + ekspor PDF

### 📝 Catatan (Notes)
- Simpan daftar belanja atau detail trip
- Reorder dengan tombol ↑↓
- Data tersimpan di Supabase (sync antar device)

### 🤖 Patungan AI
- Asisten bertenaga Gemini 2.5 Flash Lite
- Riwayat chat tersimpan di Supabase per user email
- Responsive UI (Floating di Desktop, Full-screen di Mobile)

---

## 🌐 Deployment

### Vercel (Recommended)

1. Hubungkan repository ke Vercel
2. Tambahkan Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
3. Klik **Deploy**

### Manual Build
```bash
npm run build
# Upload folder 'dist' ke hosting pilihan Anda
```

---

## 🤝 Contributing

Contributions are welcome! Silakan buat issue atau pull request.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Author

Built with ❤️ by [Nexteam](https://www.nofileexistshere.my.id/)
