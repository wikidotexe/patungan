# 💰 Patungan

**Bagi tagihan dengan mudah • Pajak & Service otomatis • AI Assistant**

Aplikasi web untuk membagi tagihan dengan teman-teman secara mudah dan akurat. Mendukung perhitungan pajak, service charge, pembagian custom per item, dan asisten AI terintegrasi.

---

## ✨ Fitur Utama

- 🧮 **Split Bill Otomatis** - Bagi tagihan secara merata dengan perhitungan pajak & service otomatis
- 🎯 **Custom Split Bill** - Tentukan siapa yang bayar item apa (Ekspor PDF & Share WA)
- 📝 **Catatan (Notes)** - Catat daftar belanja atau rencana trip dengan fitur reorder & filter
- 🤖 **Patungan AI** - Asisten cerdas bertenaga Gemini 2.5 Flash Lite untuk tips trip & keuangan
- 📊 **Ringkasan Detail** - Lihat breakdown pembayaran per orang secara transparan
- 📱 **Mobile Responsive** - Tampilan optimal di semua perangkat (Full-screen Chat on Mobile)
- 📤 **Share ke WhatsApp** - Bagikan hasil perhitungan langsung ke WhatsApp
- 📋 **Copy to Clipboard** - Salin ringkasan pembayaran dengan satu klik

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 atau lebih tinggi)
- npm atau bun

### Installation

```bash
# Clone repository
git clone <YOUR_GIT_URL>

# Masuk ke direktori project
cd patungan

# Install dependencies
npm install
# atau
bun install

# Konfigurasi Environment Variables
cp .env.example .env # Jika ada, atau buat file .env baru
```

Tambahkan API Key Anda di file `.env`:
```env
VITE_GEMINI_API_KEY=AIzaSy...
```

### Running Locally

```bash
# Jalankan development server
npm run dev
# atau
bun dev
```

Aplikasi akan berjalan di `http://localhost:8080` (Default Port)

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
| **Gemini AI** | AI Engine (Gemini 2.5 Flash Lite) |
| **Next-Themes** | Dark Mode Support |
| **Lucide React** | Icons |
| **html2pdf.js** | PDF Export |

---

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

---

## 📁 Project Structure

```
patungan/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── dist/               # Build output
```

---

## 🎨 Features in Detail

### 🧮 Split Bill
Bagi tagihan secara merata dengan fitur:
- Input jumlah teman
- Tambah item dengan nama dan harga
- Perhitungan otomatis pajak & service
- Ringkasan per orang

### 🎯 Custom Split Bill
Kontrol penuh siapa bayar apa:
- Assign item ke orang tertentu
- Satu item bisa dibagi beberapa orang
- Item bersama untuk semua
- Perhitungan proporsional

### 📝 Catatan (Notes)
- Simpan daftar belanja atau detail trip
- Fitur drag-and-drop style reordering (Up/Down)
- Konfirmasi hapus yang aman
- Tersimpan otomatis di LocalStorage

### 🤖 Patungan AI
- Asisten bertenaga Gemini 2.5 Flash Lite
- Paham konteks aplikasi (Split Bill, Notes, dll)
- Responsive UI (Floating di Desktop, Full-screen di Mobile)
- Mode Maximize/Minimize untuk kenyamanan di HP

---

## 🌐 Deployment

### Vercel (Recommended)
Project ini sudah dikonfigurasi untuk deploy di Vercel dengan `vercel.json` untuk mendukung SPA routing.

1. Hubungkan repository ke Vercel.
2. Tambahkan Environment Variable: `VITE_GEMINI_API_KEY`.
3. Klik **Deploy**.

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

Built with ❤️ using [Nexteam](https://www.nofileexistshere.my.id/)

---

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.
