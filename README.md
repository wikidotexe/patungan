# 💰 Patungan

**Bagi tagihan dengan mudah • Data tersimpan di cloud • AI Assistant**

> Versi: **v2.2.1**

Aplikasi web untuk membagi tagihan dengan teman-teman secara mudah dan akurat. Mendukung perhitungan pajak, service charge, pembagian custom per item, scan struk dengan AI, user session berbasis email, dan asisten AI terintegrasi.

🌐 **Live**: [patungan.fornexteam.com](https://patungan.fornexteam.com) · [patunganbayar.vercel.app](https://patunganbayar.vercel.app) (mirror)

---

## ✨ Fitur Utama

- 👤 **User Session** - Masukkan nama & email sekali, data tersimpan di cloud dan sync antar device
- 🧮 **Split Bill Otomatis** - Bagi tagihan secara merata dengan perhitungan pajak & service otomatis
- 🎯 **Custom Split Bill** - Tentukan siapa yang bayar item apa (Ekspor PDF & Share WA)
- � **Scan Struk (AI Vision)** - Foto struk → item & harga otomatis ter-ekstrak
- 🔍 **Pencarian Data Tersimpan** - Cari cepat riwayat tagihan berdasarkan judul
- �📝 **Catatan (Notes)** - Catat daftar belanja atau rencana trip dengan fitur reorder — tersimpan di Supabase
- 🤖 **Patungan AI** - Asisten cerdas via endpoint OpenAI-compatible (Nexteam Router), riwayat chat tersimpan di cloud
- 📊 **Ringkasan Detail** - Lihat breakdown pembayaran per orang secara transparan
- 📱 **PWA Ready** - Bisa di-install sebagai aplikasi di HP/desktop, dengan tampilan mobile compact
- 📤 **Share ke WhatsApp** - Bagikan hasil perhitungan langsung ke WhatsApp
- 📋 **Copy to Clipboard** - Salin ringkasan pembayaran dengan satu klik
- 🌗 **Dark / Light Mode** - Tema mengikuti sistem atau bisa diatur manual

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 atau lebih tinggi)
- npm atau bun
- Akun [Supabase](https://supabase.com)
- API Key AI (OpenAI-compatible, contoh: [Nexteam Router](https://9router.nexteam.web.id))

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
# Supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# AI (OpenAI-compatible endpoint)
# Untuk dev lokal, gunakan path proxy /ai-proxy/v1 (di-handle vite.config.ts)
# Untuk production, ganti ke URL absolut endpoint AI Anda.
VITE_AI_API_ENDPOINT=/ai-proxy/v1
VITE_AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AI_MODEL=free-forever
```

> **Catatan CORS**: `vite.config.ts` sudah menyediakan proxy `/ai-proxy` → `https://9router.nexteam.web.id` untuk bypass CORS saat development. Di production, endpoint AI harus mengizinkan CORS dari domain Anda, atau gunakan proxy/rewrite di hosting (Vercel/Netlify/Nginx).

### Setup Database (Supabase)

Jalankan SQL berikut di **Supabase Dashboard → SQL Editor** (lihat `SUPABASE_SETUP.md` untuk skema lengkap):

```sql
-- Tabel existing (Split Bill)
CREATE TABLE bills ( ... );
CREATE TABLE bill_people ( ... );
CREATE TABLE custom_bills ( ... );
-- ... (lihat SUPABASE_SETUP.md)

-- Tabel Notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  content TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Chat AI
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

Aplikasi akan berjalan di `http://localhost:8080` (atau port berikutnya kalau sudah dipakai).

---

## 🛠️ Tech Stack

| Technology               | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| **React 18**             | UI Framework                                              |
| **TypeScript**           | Type Safety                                               |
| **Vite**                 | Build Tool & Dev Server + Proxy AI                        |
| **Tailwind CSS**         | Styling (responsive breakpoints)                          |
| **shadcn/ui**            | UI Components                                             |
| **Framer Motion**        | Animations & Transitions                                  |
| **Supabase**             | Database & Cloud Storage                                  |
| **OpenAI-compatible AI** | Chat & Vision (via Nexteam Router / model `free-forever`) |
| **Next-Themes**          | Dark Mode Support                                         |
| **Lucide React**         | Icons                                                     |
| **html2pdf.js**          | PDF Export                                                |
| **Vite PWA**             | Progressive Web App                                       |

---

## 📦 Available Scripts

```bash
npm run dev          # Start dev server (dengan proxy /ai-proxy)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## 📁 Project Structure

```
patungan/
├── src/
│   ├── components/     # Reusable UI (ChatAI, CoffeeBubble, ReceiptScanner, ...)
│   ├── pages/          # Page components (Home, SplitBill, CustomSplit, Notes, ...)
│   ├── lib/            # Utility (supabase.ts, userStore.ts, bill.ts, ...)
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sitemap.xml           # Multi-domain sitemap (alternate links)
│   └── robots.txt
├── vite.config.ts      # Vite config + proxy /ai-proxy
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

- Input item & harga (atau **Scan Struk**), pajak & service otomatis
- Bagi rata per teman, share ke WhatsApp
- Riwayat tagihan tersimpan & bisa dicari

### 🎯 Custom Split Bill

- Assign item ke orang tertentu
- Import hasil scan struk lalu pilih penerima per item (dropdown scrollable)
- Perhitungan proporsional + ekspor PDF + share WA

### � Scan Struk

- Ambil foto / upload gambar struk → AI Vision ekstrak item & harga
- Hasil bisa langsung ditambah ke Split Bill atau Custom Split

### 🔍 Search Data Tersimpan

- Kotak pencarian di halaman "Split Bill" & "Custom Split Bill"
- Filter case-insensitive berdasarkan judul

### �📝 Catatan (Notes)

- Simpan daftar belanja atau detail trip
- Reorder dengan tombol ↑↓
- Data tersimpan di Supabase (sync antar device)

### 🤖 Patungan AI

- Endpoint OpenAI-compatible (default: [Nexteam Router](https://9router.nexteam.web.id), model `free-forever`)
- Response otomatis dibersihkan dari markdown (plain-text friendly)
- Riwayat chat tersimpan di Supabase per user email
- Responsive UI (Floating di Desktop, Full-screen di Mobile)

---

## 🌐 Deployment

### Vercel (Recommended)

1. Hubungkan repository ke Vercel
2. Tambahkan Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_AI_API_ENDPOINT` (URL absolut, misal `https://9router.nexteam.web.id/v1`)
   - `VITE_AI_API_KEY`
   - `VITE_AI_MODEL` (default `free-forever`)
3. Klik **Deploy**

Support **multi-domain** — canonical utama diset ke `patungan.fornexteam.com`, domain `patungan.vercel.app` tetap valid sebagai mirror (lihat `public/sitemap.xml` dan `index.html`).

### Manual Build

```bash
npm run build
# Upload folder 'dist' ke hosting pilihan Anda
```

---

## 📝 Changelog

### v2.2.1

- Migrasi endpoint AI: Gemini SDK → OpenAI-compatible (Nexteam Router)
- Tambah **Scan Struk** (AI Vision) untuk Split Bill & Custom Split
- Tambah **Search** di data tersimpan
- Multi-domain support (fornexteam.com + vercel.app)
- Compact UI di mobile view (padding/spacing/font)
- Response AI dibersihkan dari format markdown
- Bubble AI & Coffee mengecil di mobile

---

## 🤝 Contributing

Contributions are welcome! Silakan buat issue atau pull request.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Author

Built with ❤️ by [Nexteam](https://www.nofileexistshere.my.id/)
