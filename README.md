# SmartMart AI — Next-Gen POS Terminal & Customer Experience Engine

An enterprise-grade, futuristic retail POS terminal and AI customer experience engine built 100% for the frontend with React, Tailwind CSS, Web Audio API, Web Speech API, and LocalStorage persistence.

## 🚀 Live Demo & URL
- **Local Terminal URL:** `http://localhost:3000/`
- **Network Mobile Testing:** `http://10.74.127.29:3000/`
- **Admin Settings Default PIN:** `1234` (Master Override: `9999`)

---

## 🌟 Core Highlights & Architectural Features

### 1. Futuristic Cyber/Neon POS UI & Navigation
- **App Title & Badges:** "SmartMart AI" with "Smart POS Terminal" active badge, Counter terminal ID (`TERMINAL-04 (Express AI)`), and active cashier (`Aakash Mehta`).
- **Live Clock & Date:** Real-time synchronized time and date display with millisecond precision.
- **Hardware & Engine Status Indicators:** Live status pills for Multi-Face CV Engine, AI Soundbox Listener, and Loyalty Engine v2.4.

### 2. Main Left Column: POS Operations & Cart
- **Search & Barcode Bar:** Quick text search or barcode lookup (press `Enter ↵` to add instantly).
- **Hardware Scanner Simulation:** "Laser Scan" button triggers instant barcode gun sound effect and adds random item.
- **Current Cart Items Table:**
  - Columns: `Sr`, `Item Name` (with Low Stock badge if $\le 3$), `Quantity (- / +)`, `Price (₹ with inline edit toggle)`, `Total`, and `Action (❌)`.
  - Actions: **Clear Cart** and **"Click any Price to edit"** inline toggle.
- **Quick Catalog Picker Drawer:** Interactive grid grouped by categories (`Grocery & Staples`, `Dairy & Essentials`, `Snacks & Treats`, `Beverages`, `Personal Care`) for 1-tap item entry.
- **Dynamic Smart AI Cross-Sell / Habit Prompts Banner:** 
  - Dynamic AI suggestions beneath cart items based on customer habit patterns (e.g., *"Rahul ji usually buys Red Label Tea on every visit — Suggest it?"*) or association rules (e.g., *"Customers who bought Olive Oil also added Pasta & Cheese!"*).
  - One-click `+ Add Suggestion` button.
- **Billing Subtotal & Discounts Section:**
  - Gross Subtotal display.
  - Dynamic **Rank Loyalty Discount** breakdown (e.g., Rank #4 = 20% off: `-₹287.60`).
  - **Extra / VIP Cashier Discount** manual input field (toggle between `₹` flat and `%` percentage).
  - Prominent **Final Total Payable Amount** neon gradient card with customer savings counter.
  - Payment Action Buttons: **Pay Cash**, **Pay Online (UPI)**, and **Split (Cash+UPI)**.

### 3. Main Right Column: AI Multi-Face & Customer Profile
- **AI Multi-Face Camera Feed Simulation:**
  - Simulated 30 FPS neural computer vision HUD with bounding boxes, facial confidence (98.7%), emotion analytics, and detected queue members.
  - Customer status pills: `Rank #4 (5 Visits)`, `Rank #14 (3 Visits)`, `NEW CUSTOMER (1st Visit)`.
  - **Clickable Face Cards:** Tap any person in the camera view to instantly switch active customer, load profile, calculate discounts, and trigger voice greeting!
  - **Real Webcam Toggle:** Switch between simulated queue and actual physical device webcam with canvas HUD overlays.
  - Action triggers: **Register New Customer (10s)** and **Manual ID Lookup**.
- **Active Customer Profile Box:**
  - Displays selected customer's **Live Face Snapshot** avatar.
  - Customer ID / Mobile lookup box with **Load** button and **Saved List** dropdown selector.
  - Name, Mobile No., Address, Loyalty Tier / Rank Badge.
  - **Cashier Greeting Box:** AI voice quote (*"Welcome back, Rahul Sharma ji! Today is your 5th visit to our mall."*) with interactive **Voice button** to replay.
- **Customer Analytics & History Cards:**
  - **Total Mall Visits** tracked by AI Face Tracker.
  - **Last Buy Amount & Date**.
  - **Live Cart Milestone Progress Bar:** Dynamically tracks present active cart gross subtotal against the configurable milestone target (e.g., `₹[currentCartSubtotal] / ₹[milestoneTargetAmount]`), showing remaining amount to unlock reward or a 100% unlocked banner that automatically applies an instant flat discount (`milestoneDiscountAmount`) to the current bill.
  - **All Previous Shopping Table:** Detailed list of past visits with a `...` (3 dots) button on each row that pops open that day's complete itemized bill invoice.

### 4. Pre-Loaded Product & Pricing Catalog
The database initializes with all 16 items specified in the blueprint:
- **Grocery & Staples:** Basmati Premium Rice (5kg) ₹540, Aashirvaad Shudh Chakki Atta (5kg) ₹265, Fortune Sunlite Refined Oil (1L) ₹145, Extra Virgin Olive Oil (1L) ₹850, Tata Salt (1kg) ₹28.
- **Dairy & Daily Essentials:** Amul Full Cream Milk (1L) ₹68, Amul Butter (500g) ₹275, Fresh Malai Paneer (200g) ₹95.
- **Snacks & Chocolates:** Cadbury Dairy Milk Silk (150g) ₹175, Haldiram’s Aloo Bhujia (400g) ₹115, Oreo Vanilla Biscuits (120g) ₹35.
- **Beverages:** Red Label Natural Care Tea (500g) ₹290, Nescafe Classic Coffee (50g) ₹185.
- **Personal Care & Cleaning:** Dove Nourishing Soap (125g) ₹65, Surf Excel Detergent (1kg) ₹140, Dettol Liquid Handwash Refill (175ml) ₹55 (*Low Stock indicator: 2 left*).

### 5. Smart AI Soundbox & Audio Synthesizer
- **Supermarket Scanner Audio FX ("Beep"):** High-frequency 2350Hz synthetic oscillator chirp via Web Audio API whenever products are added or scanned.
- **Cash Register Drawer ("Cha-Ching"):** Dual mechanical resonant bell ding when cash payment is received.
- **Fintech Soundbox Jingle:** Modern 4-note ascending chime for UPI payments.
- **Thermal Printer Ratchet:** Rhythmic stepper motor audio while thermal receipt rolls out.
- **AI Voice Greetings & Payment Announcements:** Web Speech API synthesizes personalized welcoming greetings and speaks payment confirmations aloud:
  > *"Payment of Rupees 1,150 received successfully on UPI. Thank you for shopping at SmartMart AI!"*

### 6. Thermal Receipt Roll-out Animation & Print Flow
- Realistic gold/cream roller graphic with downward receipt rollout animation (`receipt-roll`).
- Monospace paper slip with jagged/serrated cut bottom.
- Displays: Mart Name, Invoice #, Date/Time, Customer Name & ID, Loyalty Rank, Itemized table, Gross Subtotal, Rank VIP Discount, Special Discount, Total Paid, Payment Mode, and Verification QR code.
- Actions:
  - **Print Receipt:** Browser print window formatted for 80mm thermal receipt.
  - **Re-print:** Re-triggers roller animation and printing sound.
  - **Send Bill:** Simulates WhatsApp message delivery to customer's mobile number.
  - **Tear & Next:** Smooth tear cut animation and resets terminal for the next customer.

### 7. PIN-Protected Settings & POS Control Panel (Default PIN: 1234)
- **Security & PIN Authentication:** 4-digit PIN modal, "Forgot Password?" hint, and "Change Admin PIN" tab.
- **Mart Branding:** Edit Mart Name, Tagline, GSTIN, Helpline, Counter ID, and Cashier Name.
- **UPI & QR Configuration:** Custom VPA (e.g., `smartmart.ai@icici`) and legal payee name.
- **Milestone Loyalty Reward Configuration:** Configurable "Milestone Target Purchase Amount (₹)" (Default: ₹10,000) and "Reward Flat Discount Amount (₹)" (Default: ₹500) under Loyalty & Milestones tab.
- **Rank-Based Discount Slabs:** Interactive table to modify discount percentages for Rank 1–5, 6–15, 16–30, 31–50, etc.
- **Sales Collection & Peak Rush Analytics:** Real-time revenue counters (Total, Cash, UPI, Split) and 7-interval peak store footfall bar chart.
- **Stock Inventory Manager:** View product stock quantities, low-stock warnings, and modify inventory counts.
- **Factory Reset:** Single-click restore to demo state.

### 8. Dedicated Customer Display & Audio Soundbox Screen (`/customer` or `#/customer`)
- **Direct Route & Quick Toggle:** Accessible at `http://localhost:3000/#/customer` or via the `"📱 Open Customer Display"` button in the Cashier header.
- **Mobile QR Connect:** Includes a phone camera QR code modal for opening on a real smartphone connected to the same Wi-Fi.
- **Zero-Backend Real-Time Synchronization:** Uses `BroadcastChannel('smartmart_sync')` + `localStorage` storage events (`smartmart_live_sync_state`) to sync between Cashier POS and Customer Mobile Screen with 0ms latency.
- **Customer Experience States:**
  - **Idle State:** Futuristic biometric radar reticle prompting: *"Welcome to SmartMart! Please look at the scanner."*
  - **Active State:** Verified customer card with live photo snapshot avatar, Rank badge, and real-time updating cart summary & total.
  - **UPI Checkout State:** Scannable high-res UPI QR code with *"Scan & Pay ₹[Amount]"*.
  - **Soundbox Payment Chime & Voice Alert:** Dual mechanical chime + confetti explosion + Web Speech API voice alert:
    > *"SmartMart AI: Rupees [Amount] received successfully from [Customer Name]! Thank you for shopping with us!"*

---

## 🛠️ Project Structure
```
d:\Raunak singh\AI Mart\
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── data/
│   │   ├── defaultCatalog.js
│   │   ├── defaultCustomers.js
│   │   └── defaultSettings.js
│   ├── services/
│   │   ├── audioService.js
│   │   ├── storage.js
│   │   └── syncService.js
│   └── components/
│       ├── Header.jsx
│       ├── BarcodeScannerBar.jsx
│       ├── CartTable.jsx
│       ├── AICrossSellBanner.jsx
│       ├── BillingSummary.jsx
│       ├── MultiFaceCamera.jsx
│       ├── CustomerProfileBox.jsx
│       ├── CustomerAnalytics.jsx
│       ├── CustomerDisplay.jsx
│       ├── PaymentModal.jsx
│       ├── ThermalReceiptModal.jsx
│       ├── InvoiceModal.jsx
│       ├── SettingsModal.jsx
│       ├── NewProductModal.jsx
│       └── NewCustomerModal.jsx
```
