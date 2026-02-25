# 🚀 QUICK START - Setup Supabase (5 Menit)

## Step 1️⃣: Sign Up Supabase

```
https://supabase.com → Sign Up → Create New Project
- Name: "patungan"
- Password: (strong password)
- Region: Asia Southeast 1
- Tunggu ~2 menit
```

## Step 2️⃣: Buat Tables

```
Dashboard Supabase:
1. SQL Editor → New Query
2. Copy-paste SQL dari SUPABASE_SETUP.md
3. Click Run
4. Tunggu sampai "All executed successfully"
```

## Step 3️⃣: Ambil API Keys

```
Dashboard Supabase:
Settings → API

Copy 2 hal ini:
- Project URL
- anon public key (API Key)
```

## Step 4️⃣: Isi .env File

```
Buka file: .env

VITE_SUPABASE_URL=<paste-url-anda>
VITE_SUPABASE_ANON_KEY=<paste-key-anda>

Save file (Ctrl+S)
```

## Step 5️⃣: Restart Dev Server

```bash
npm run dev
```

## Step 6️⃣: Test

```
1. Buka app: http://localhost:5173
2. Buat split bill baru
3. Refresh page (F5)
4. Cek apakah data masih ada ✓
```

---

## 📋 DEBUGGING Checklist

Jika tidak berfungsi, cek:

- [ ] `.env` file sudah diisi (bukan placeholder)
- [ ] Supabase project status: ACTIVE ✓
- [ ] Database tables sudah ada di Supabase
- [ ] Dev server sudah direstart (`npm run dev`)
- [ ] Console (F12) ada error? Apa errornya?
- [ ] Supabase API keys sudah benar (copy-paste lagi)

---

## 📚 Dokumentasi Lengkap

**File panduannya:**

1. `SUPABASE_SETUP.md` - Panduan detail step-by-step
2. `MIGRATION_SUMMARY.md` - Ringkasan perubahan code
3. `src/lib/supabase.ts` - Dokumentasi kode

---

## ✨ Yang Sudah Diupdate

### Code

- ✅ `src/lib/supabase.ts` - Baru
- ✅ `src/pages/SplitBill.tsx` - Sudah pakai Supabase
- ✅ `src/pages/Index.tsx` - Sudah pakai Supabase
- ✅ `.env` - Ditambah Supabase config

### Dependencies

- ✅ `@supabase/supabase-js` - Sudah installed

---

**Selamat setup! Jika ada pertanyaan, baca SUPABASE_SETUP.md untuk detail lebih lengkap! 🎉**
