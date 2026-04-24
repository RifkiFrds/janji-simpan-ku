# JanjiKuMoney v2

Personal finance application with **semester-based tracking** and **account allocation system**.

Live: https://janjiku-money.vercel.app/

---

## Overview

JanjiKuMoney helps users manage money using:

* Semester-based financial tracking
* Account-based budgeting (financial buckets)
* Saving rules and discipline tracking

The system separates:

* **Accounts** → real money (rekening)
* **Transactions** → income & expenses
* **Semesters** → analysis only (not affecting total balance)

---

## Core Features

* Global balance (total saldo semua rekening)
* Account allocation (auto distribution from master income)
* Dynamic allocation rules (must total 100%)
* Semester financial tracking
* Saving rules (minimum & ratio)
* Planned expenses & prediction
* Financial timeline
* Offline support (PWA)

---

## Account System

Example accounts:

* Master Income
* Kebutuhan Pokok
* Tabungan Masa Depan
* Lifestyle

All income goes to **Master Income**, then distributed based on allocation rules.

---

## Tech Stack

Frontend:

* React + Vite
* TypeScript
* Tailwind CSS
* shadcn/ui
* Zustand
* TanStack Query
* Recharts

Backend:

* Supabase (PostgreSQL, Auth)

PWA:

* Service Worker
* Local storage (offline queue)

---

## Development

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

---

## Notes

* Semester is used for analytics only
* Total balance is calculated from all transactions (not per semester)
* Allocation rules apply only to future income

---

## Author

Muhamad Rifki Firdaus
