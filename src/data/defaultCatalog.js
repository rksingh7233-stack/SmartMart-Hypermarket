export const DEFAULT_CATALOG = [
  // 1. Basmati Premium Rice (5kg) — ₹540 (Stock: 25)
  {
    id: "prod-1",
    name: "Basmati Premium Rice (5kg)",
    category: "Grocery & Staples",
    price: 540,
    stock: 25,
    barcode: "890103001001",
    unit: "5kg pack",
    crossSell: ["Fortune Sunlite Refined Oil (1L)", "Tata Salt (1kg)"],
    popular: true
  },
  // 2. Aashirvaad Shudh Chakki Atta (5kg) — ₹265 (Stock: 30)
  {
    id: "prod-2",
    name: "Aashirvaad Shudh Chakki Atta (5kg)",
    category: "Grocery & Staples",
    price: 265,
    stock: 30,
    barcode: "890103001002",
    unit: "5kg bag",
    crossSell: ["Tata Salt (1kg)", "Amul Butter (500g)"],
    popular: true
  },
  // 3. Fortune Sunlite Refined Oil (1L) — ₹145 (Stock: 40)
  {
    id: "prod-3",
    name: "Fortune Sunlite Refined Oil (1L)",
    category: "Grocery & Staples",
    price: 145,
    stock: 40,
    barcode: "890103001003",
    unit: "1L pouch",
    crossSell: ["Basmati Premium Rice (5kg)", "Tata Salt (1kg)"],
    popular: true
  },
  // 4. Extra Virgin Olive Oil (1L) — ₹850 (Stock: 12)
  {
    id: "prod-4",
    name: "Extra Virgin Olive Oil (1L)",
    category: "Grocery & Staples",
    price: 850,
    stock: 12,
    barcode: "890103001004",
    unit: "1L bottle",
    crossSell: ["Fresh Malai Paneer (200g)", "Oreo Vanilla Biscuits (120g)"],
    customPrompt: "Customers who bought Olive Oil also added Pasta & Cheese!"
  },
  // 5. Tata Salt (1kg) — ₹28 (Stock: 50)
  {
    id: "prod-5",
    name: "Tata Salt (1kg)",
    category: "Grocery & Staples",
    price: 28,
    stock: 50,
    barcode: "890103001005",
    unit: "1kg pouch",
    crossSell: ["Aashirvaad Shudh Chakki Atta (5kg)"]
  },

  // 6. Amul Full Cream Milk (1L) — ₹68 (Stock: 35)
  {
    id: "prod-6",
    name: "Amul Full Cream Milk (1L)",
    category: "Dairy & Daily Essentials",
    price: 68,
    stock: 35,
    barcode: "890103002001",
    unit: "1L tetra",
    crossSell: ["Oreo Vanilla Biscuits (120g)", "Nescafe Classic Coffee (50g)"],
    popular: true
  },
  // 7. Amul Butter (500g) — ₹275 (Stock: 20)
  {
    id: "prod-7",
    name: "Amul Butter (500g)",
    category: "Dairy & Daily Essentials",
    price: 275,
    stock: 20,
    barcode: "890103002002",
    unit: "500g carton",
    crossSell: ["Aashirvaad Shudh Chakki Atta (5kg)"]
  },
  // 8. Fresh Malai Paneer (200g) — ₹95 (Stock: 8)
  {
    id: "prod-8",
    name: "Fresh Malai Paneer (200g)",
    category: "Dairy & Daily Essentials",
    price: 95,
    stock: 8,
    barcode: "890103002003",
    unit: "200g pack",
    crossSell: ["Fortune Sunlite Refined Oil (1L)", "Tata Salt (1kg)"]
  },

  // 9. Cadbury Dairy Milk Silk (150g) — ₹175 (Stock: 25)
  {
    id: "prod-9",
    name: "Cadbury Dairy Milk Silk (150g)",
    category: "Snacks & Treats",
    price: 175,
    stock: 25,
    barcode: "890103003001",
    unit: "150g bar",
    crossSell: ["Haldiram’s Aloo Bhujia (400g)"],
    popular: true
  },
  // 10. Haldiram’s Aloo Bhujia (400g) — ₹115 (Stock: 18)
  {
    id: "prod-10",
    name: "Haldiram’s Aloo Bhujia (400g)",
    category: "Snacks & Treats",
    price: 115,
    stock: 18,
    barcode: "890103003002",
    unit: "400g pouch",
    crossSell: ["Red Label Natural Care Tea (500g)"],
    popular: true
  },
  // 11. Oreo Vanilla Biscuits (120g) — ₹35 (Stock: 45)
  {
    id: "prod-11",
    name: "Oreo Vanilla Biscuits (120g)",
    category: "Snacks & Treats",
    price: 35,
    stock: 45,
    barcode: "890103003003",
    unit: "120g roll",
    crossSell: ["Amul Full Cream Milk (1L)"]
  },

  // 12. Red Label Natural Care Tea (500g) — ₹290 (Stock: 15)
  {
    id: "prod-12",
    name: "Red Label Natural Care Tea (500g)",
    category: "Beverages",
    price: 290,
    stock: 15,
    barcode: "890103004001",
    unit: "500g carton",
    crossSell: ["Haldiram’s Aloo Bhujia (400g)", "Amul Full Cream Milk (1L)"],
    popular: true
  },
  // 13. Nescafe Classic Coffee (50g) — ₹185 (Stock: 14)
  {
    id: "prod-13",
    name: "Nescafe Classic Coffee (50g)",
    category: "Beverages",
    price: 185,
    stock: 14,
    barcode: "890103004002",
    unit: "50g glass jar",
    crossSell: ["Amul Full Cream Milk (1L)"]
  },

  // 14. Dove Nourishing Bathing Soap (125g) — ₹65 (Stock: 30)
  {
    id: "prod-14",
    name: "Dove Nourishing Bathing Soap (125g)",
    category: "Personal Care",
    price: 65,
    stock: 30,
    barcode: "890103005001",
    unit: "125g bar",
    crossSell: ["Dettol Liquid Handwash Refill (175ml)"]
  },
  // 15. Surf Excel Quick Wash Detergent (1kg) — ₹140 (Stock: 22)
  {
    id: "prod-15",
    name: "Surf Excel Quick Wash Detergent (1kg)",
    category: "Personal Care",
    price: 140,
    stock: 22,
    barcode: "890103005002",
    unit: "1kg bag",
    crossSell: ["Dove Nourishing Bathing Soap (125g)"]
  },
  // 16. Dettol Liquid Handwash Refill (175ml) — ₹55 (Stock: 3)
  {
    id: "prod-16",
    name: "Dettol Liquid Handwash Refill (175ml)",
    category: "Personal Care",
    price: 55,
    stock: 3, // Stock <= 3 triggers Low Stock Alert!
    barcode: "890103005003",
    unit: "175ml pouch",
    crossSell: ["Dove Nourishing Bathing Soap (125g)"]
  }
];
