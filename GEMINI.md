# SmartMart AI — Project Memory & Architecture Context

## Overview
**SmartMart AI** is a futuristic, next-generation retail POS terminal and AI customer experience engine built 100% on the frontend for hackathons and retail demonstrations.

- **Workspace Path:** `d:\Raunak singh\AI Mart`
- **Live Local URL:** `http://localhost:3000/`
- **Admin Settings Default PIN:** `1234` (Master Recovery Code: `SMART-ADMIN`)

---

## Real Live AI Multi-Face Detection & Recognition (`face-api.js`)
- **Engine:** `@vladmandic/face-api` loaded via CDN in `index.html`.
- **Zero Static/Fake Boxes:** Canvas overlay draws bounding boxes **ONLY around real human faces currently in front of the camera** (0 faces = 0 boxes).
- **128-float Biometric Vectors:** Computes 128-dimensional biometric descriptors and matches via Euclidean distance against saved customers in `localStorage`.
- **New Face Detection:** Emerald green box labeled `"NEW CUSTOMER"`. Clicking `+ Register Face` captures the real video frame crop as their photo snapshot, computes biometric descriptor, and opens rapid registration.
- **Recognized Face Detection:** Cyan box labeled `"Rank #[X] | ID: CUST-XXXX"`. Automatically loads their real photo snapshot, visits, loyalty rank, and triggers personalized voice greeting.
- **Manual ID / Mobile Lookup:** Fallback search box to load any registered customer profile without camera.

---

## Product Stock & Pricing Manager (Auto-Sort & Custom Thresholds)
- **Auto-Sort by Lowest Stock First:** The inventory table automatically sorts items in ascending order (`a.stock - b.stock`) so low-stock items are prominently displayed at the top.
- **3-Tier Interactive Threshold Controls:** Configurable number inputs for Low Stock Threshold (default: 5) and Medium Stock Threshold (default: 15), persisted in `localStorage` under `smartmart_stock_thresholds`.
- **Dynamic Status Badges:**
  - $\text{Stock} \le \text{lowThreshold}$: Red "Low Stock" badge with alert icon.
  - $\text{lowThreshold} < \text{Stock} \le \text{mediumThreshold}$: Yellow "Medium Stock" badge.
  - $\text{Stock} > \text{mediumThreshold}$: Green "In Stock" badge.

---

## Daily Sales & Day End Reset
- **Reset Daily Sales / Day End Action:** Dedicated button in Analytics tab.
- **Confirmation Protection:** Prompts confirmation before execution.
- **Reset Scope:** Clears daily revenue, UPI collected, Cash collected, bills generated, sales transaction records (`smartmart_sales_history_v2`), and peak rush hour footfall counters to 0 while keeping customer profiles, inventory items, and mart settings completely intact.

---

## UPI Gateway Configuration & Custom QR Standee
- **Custom Store QR Standee Upload:** Supports uploading physical store standee / static QR image files (PNG, JPG, WebP) with live preview and removal.
- **Base64 Storage:** Converted to Base64 and persisted in `localStorage` under `settings.customQrImage`.
- **Checkout Display:** UPI checkout displays this custom standee image if present, and falls back to dynamic NPCI QR generation if none is uploaded.

---

## Milestone Loyalty Reward Logic & Admin Configuration
- **Current Cart / Present Bill Based Source:** The milestone reward progress is computed directly from the present active cart gross subtotal (`currentCartSubtotal`) instead of historical customer lifetime spend.
- **Dynamic Formula:**
  - $\text{progressPercent} = \min(100, \text{round}((\text{currentCartSubtotal} / \text{milestoneTargetAmount}) \times 100))$
  - Display: `₹[currentCartSubtotal] / ₹[milestoneTargetAmount]`
  - $\text{currentCartSubtotal} < \text{milestoneTargetAmount}$: Displays `₹(milestoneTargetAmount - currentCartSubtotal) away from reward!`.
  - $\text{currentCartSubtotal} \ge \text{milestoneTargetAmount}$: Displays `100% Completed - Unlocked ₹[milestoneDiscountAmount] Flat Discount!`.
- **Auto-Applied Discount Breakdown:** Automatically applies `milestoneDiscountAmount` in the bill discount calculation, receipt printout, invoice modal, and live customer screen sync.
- **Admin Configuration Block ("🎁 Milestone Loyalty Reward Configuration"):**
  - Configurable in Admin Settings under `Loyalty & Milestones`:
    - `milestoneTargetAmount` (Default: ₹10,000)
    - `milestoneDiscountAmount` (Default: ₹500)
  - Persisted in `localStorage` under `smartmart_settings_v2` and dynamically updates terminal behavior across all components.

---

## Pre-Loaded Product Catalog (16 Supermarket Items)
1. Basmati Premium Rice (5kg) — ₹540 (Stock: 25)
2. Aashirvaad Shudh Chakki Atta (5kg) — ₹265 (Stock: 30)
3. Fortune Sunlite Refined Oil (1L) — ₹145 (Stock: 40)
4. Extra Virgin Olive Oil (1L) — ₹850 (Stock: 12)
5. Tata Salt (1kg) — ₹28 (Stock: 50)
6. Amul Full Cream Milk (1L) — ₹68 (Stock: 35)
7. Amul Butter (500g) — ₹275 (Stock: 20)
8. Fresh Malai Paneer (200g) — ₹95 (Stock: 8)
9. Cadbury Dairy Milk Silk (150g) — ₹175 (Stock: 25)
10. Haldiram’s Aloo Bhujia (400g) — ₹115 (Stock: 18)
11. Oreo Vanilla Biscuits (120g) — ₹35 (Stock: 45)
12. Red Label Natural Care Tea (500g) — ₹290 (Stock: 15)
13. Nescafe Classic Coffee (50g) — ₹185 (Stock: 14)
14. Dove Nourishing Bathing Soap (125g) — ₹65 (Stock: 30)
15. Surf Excel Quick Wash Detergent (1kg) — ₹140 (Stock: 22)
16. Dettol Liquid Handwash Refill (175ml) — ₹55 (Stock: 3)

---

## Dedicated Customer Display & Audio Soundbox (`/customer` or `#/customer`)
- **Direct Access Route:** Accessible directly via `http://localhost:3000/#/customer` or `/customer`, or by clicking `"📱 Open Customer Display"` in the top header. Includes a mobile QR scan popup so customers or judges can load it onto their smartphone via LAN.
- **Dual Real-Time Sync (Zero Backend):** Uses `BroadcastChannel('smartmart_sync')` for instantaneous in-memory messaging across browser windows/tabs, and `localStorage` storage events (`smartmart_live_sync_state`) for tab reload resilience.
- **Dynamic Mobile UI States:**
  1. *Idle State:* Rotating biometric scan reticle inviting customer: *"Welcome to SmartMart! Please look at the scanner."*
  2. *Active Customer State:* Big personalized greeting card with verified face avatar photo snapshot, loyalty Rank badge (`Rank #[X]`), customer ID, and live cart summary (items count, subtotal, savings, and grand total payable).
  3. *Payment Pending State:* Large scannable UPI QR code (supporting both uploaded store standee or dynamic NPCI UPI QR) with bold banner *"Scan & Pay ₹[Amount]"*.
  4. *Payment Success & Soundbox Alert:* Instant visual celebration (confetti + success card), mechanical cash-register chime, and loud Web Speech announcement on mobile speaker:
     > *"SmartMart AI: ₹[Amount] received successfully from [Customer Name]! Thank you for shopping with us!"*
