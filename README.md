# 💰 Patungan

**Bagi tagihan dengan mudah • Pajak & Service otomatis**

Aplikasi web untuk membagi tagihan dengan teman-teman secara mudah dan akurat. Mendukung perhitungan pajak, service charge, dan pembagian custom per item.

---

## ✨ Fitur Utama

- 🧮 **Split Bill Otomatis** - Bagi tagihan secara merata dengan perhitungan pajak & service otomatis
- 🎯 **Custom Split Bill** - Tentukan siapa yang bayar item apa
- 📊 **Ringkasan Detail** - Lihat breakdown pembayaran per orang
- 📱 **Mobile Responsive** - Tampilan optimal di semua perangkat
- 📤 **Share ke WhatsApp** - Bagikan hasil perhitungan langsung ke WhatsApp
- 📋 **Copy to Clipboard** - Salin ringkasan pembayaran dengan satu klik
- 🎓 **Tutorial Interaktif** - Panduan langkah demi langkah untuk pengguna baru

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

# Jalankan development server
npm run dev
# atau
bun dev
```

Aplikasi akan berjalan di `http://localhost:5173`

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool & Dev Server |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI Components |
| **Radix UI** | Accessible Component Primitives |
| **React Router** | Routing |
| **Framer Motion** | Animations |
| **React Hook Form** | Form Management |
| **Zod** | Schema Validation |
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

### Split Bill
Bagi tagihan secara merata dengan fitur:
- Input jumlah teman
- Tambah item dengan nama dan harga
- Perhitungan otomatis pajak & service
- Ringkasan per orang

### Custom Split Bill
Kontrol penuh siapa bayar apa:
- Assign item ke orang tertentu
- Satu item bisa dibagi beberapa orang
- Item bersama untuk semua
- Perhitungan proporsional

### Share & Export
- Copy ringkasan ke clipboard
- Share langsung ke WhatsApp
- Format yang rapi dan mudah dibaca

---

## 🌐 Deployment

### Vercel (Recommended)
Project ini sudah dikonfigurasi untuk deploy di Vercel dengan `vercel.json`.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

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

Built with ❤️ using [Lovable](https://lovable.dev)

---

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.
