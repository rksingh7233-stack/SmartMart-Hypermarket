export const DEFAULT_SETTINGS = {
  adminPin: "1234",
  recoveryHint: "Default Demo PIN: 1234 or Master Code: 9999",
  securityQuestion: "What is the store branch code?",
  securityAnswer: "SM01",
  martName: "SmartMart Hypermarket",
  tagline: "Next-Gen AI Autonomous Retail Terminal",
  gstin: "29AAECS1234F1Z8",
  helpline: "+91 80 4961 8888",
  counterId: "TERMINAL-04 (Express AI)",
  cashierName: "Aakash Mehta (ID: CS-882)",
  upiId: "smartmart.ai@icici",
  payeeName: "SmartMart Retail Ltd",
  currencySymbol: "₹",
  voiceGreetingEnabled: true,
  scannerBeepEnabled: true,
  milestoneTargetAmount: 10000,
  milestoneDiscountAmount: 500,
  discountSlabs: [
    { id: "slab-1", tier: "Platinum Tier", rankMin: 1, rankMax: 5, discountPct: 20, badgeColor: "cyan" },
    { id: "slab-2", tier: "Gold Tier", rankMin: 6, rankMax: 15, discountPct: 15, badgeColor: "amber" },
    { id: "slab-3", tier: "Silver Tier", rankMin: 16, rankMax: 30, discountPct: 10, badgeColor: "purple" },
    { id: "slab-4", tier: "Bronze Tier", rankMin: 31, rankMax: 50, discountPct: 5, badgeColor: "blue" },
    { id: "slab-5", tier: "Standard / New", rankMin: 51, rankMax: 999, discountPct: 0, badgeColor: "slate" },
  ],
  rushHours: [
    { hour: "10 AM", footfall: 42, sales: 18400 },
    { hour: "12 PM", footfall: 88, sales: 42500 },
    { hour: "02 PM", footfall: 65, sales: 29800 },
    { hour: "04 PM", footfall: 95, sales: 51200 },
    { hour: "06 PM", footfall: 148, sales: 88900 }, // Peak
    { hour: "08 PM", footfall: 162, sales: 96400 }, // Peak
    { hour: "10 PM", footfall: 74, sales: 34100 },
  ]
};
