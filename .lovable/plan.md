

# JanjiKuMoney - Aplikasi Keuangan Semester

## Overview
Aplikasi pelacak keuangan personal berbasis semester untuk mahasiswa, dengan UI modern iOS-style fintech. Dibangun dengan React + Vite + Supabase (bukan Next.js, karena keterbatasan platform).

## Database Schema (Supabase)

**profiles** - Data profil pengguna
- id, full_name, avatar_url

**semesters** - Periode semester
- id, user_id, name, start_date, end_date, income_total, saving_target

**categories** - Kategori transaksi (default + custom)
- id, user_id (null untuk default), name, icon, is_default

**transactions** - Catatan pemasukan/pengeluaran
- id, user_id, semester_id, category_id, title, amount, type (income/expense), date, notes

**planned_expenses** - Rencana pengeluaran masa depan
- id, user_id, semester_id, title, amount

## Authentication
- Email/password signup & login
- Google OAuth
- Auto-create profile on signup via trigger

## Pages & Navigation

**Bottom Navigation Bar** (sticky, mobile-native style)
- Dashboard, Transaksi, Semester, Analitik, Profil

### 1. Dashboard
- Balance card besar (Total Tabungan) dengan desain gradient
- Ringkasan semester: Pemasukan, Pengeluaran, Saldo
- Progress bar target tabungan dengan indikator warna (hijau/kuning/merah)
- Daftar transaksi terbaru (3-5 item)

### 2. Transaksi
- Daftar semua transaksi dengan filter semester
- Setiap item: ikon kategori, judul, jumlah (warna hijau/merah), tanggal
- Floating Action Button (+) → modal quick-add transaksi (judul, jumlah, kategori, tipe)

### 3. Semester
- Daftar kartu semester (nama, periode, pemasukan, target)
- Buat/edit semester baru
- Financial timeline: riwayat tabungan per semester

### 4. Analitik
- Chart pengeluaran per kategori (pie/donut)
- Perbandingan pemasukan vs pengeluaran (bar chart)
- Pertumbuhan tabungan (line chart)
- Prediksi saldo akhir semester berdasarkan planned expenses

### 5. Profil
- Info user, logout
- Manajemen kategori custom

## Komponen Reusable
- BalanceCard, TransactionItem, CategoryBadge, SemesterCard
- SavingProgressBar, BottomNavbar, QuickAddTransactionModal

## Design
- Mobile-first, iOS fintech style
- Rounded cards, soft shadows, smooth transitions
- Tipografi besar untuk angka saldo
- Color scheme: clean white dengan aksen biru/hijau

## PWA
- Web app manifest untuk installability
- Basic service worker setup

