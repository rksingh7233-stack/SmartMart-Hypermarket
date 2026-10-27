import { DEFAULT_CATALOG } from '../data/defaultCatalog';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';

const STORAGE_KEYS = {
  CATALOG: 'smartmart_catalog_v2',
  CUSTOMERS: 'smartmart_customers_v2', // clean empty customer array []
  SETTINGS: 'smartmart_settings_v2',
  SALES: 'smartmart_sales_history_v2',
  THRESHOLDS: 'smartmart_stock_thresholds',
  ACCOUNT: 'smartmart_account_v1',
  AUTH_USER: 'smartmart_auth_user_v1',
  SETTINGS_PASSWORD: 'smartmart_settings_password_v1',
  TRIAL: 'smartmart_trial_v1'
};

// Mask email for privacy (e.g. "raunaksingh@gmail.com" -> "rau*****@gmail.com")
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'use*****@domain.com';
  }
  const [localPart, domainPart] = email.trim().split('@');
  if (localPart.length <= 2) {
    return `${localPart}*****@${domainPart}`;
  }
  const visible = localPart.slice(0, 3);
  return `${visible}*****@${domainPart}`;
};

// Initializer to load defaults if empty
export const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.CATALOG)) {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(DEFAULT_CATALOG));
  }
  // Guarantee starting with an EMPTY customer array [] (zero dummy data)
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.THRESHOLDS)) {
    localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify({ low: 5, medium: 15 }));
  }

  // Initialize trial if not present
  if (!localStorage.getItem(STORAGE_KEYS.TRIAL)) {
    const trialData = {
      startDate: Date.now(),
      totalDays: 30
    };
    localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(trialData));
  }
};

// --- AUTH & ACCOUNT API ---

export const getAccount = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveAccount = (accountData) => {
  localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(accountData));
  
  // Also start 30-day trial from registration date
  const trialData = {
    startDate: Date.now(),
    totalDays: 30
  };
  localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(trialData));

  // Automatically sync shop details to terminal settings for printing on bills
  const currentSettings = getSettings();
  const updatedSettings = {
    ...currentSettings,
    martName: accountData.shopName || currentSettings.martName,
    shopAddress: accountData.shopAddress || currentSettings.shopAddress,
    helpline: accountData.phone || currentSettings.helpline,
    gstin: accountData.gstin || currentSettings.gstin,
    email: accountData.email || currentSettings.email
  };
  saveSettings(updatedSettings);

  return updatedSettings;
};

export const getAuthUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveAuthUser = (user) => {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
};

// --- SETTINGS PASSWORD (OUTSIDE GATE) API ---

export const getSettingsPassword = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.SETTINGS_PASSWORD) || null;
  } catch (e) {
    return null;
  }
};

export const saveSettingsPassword = (password) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS_PASSWORD, password);
};

// --- 30-DAY FREE TRIAL TRACKER API ---

export const getTrialInfo = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRIAL);
    let data;
    if (raw) {
      data = JSON.parse(raw);
    } else {
      data = { startDate: Date.now(), totalDays: 30 };
      localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(data));
    }

    const startDate = data.startDate || Date.now();
    const totalDays = data.totalDays || 30;
    const msPassed = Date.now() - startDate;
    const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysPassed);
    const isExpired = daysRemaining <= 0;

    return {
      startDate,
      totalDays,
      daysPassed,
      daysRemaining,
      isExpired
    };
  } catch (e) {
    return { startDate: Date.now(), totalDays: 30, daysPassed: 0, daysRemaining: 30, isExpired: false };
  }
};

export const extendTrial = (additionalDays = 30) => {
  const current = getTrialInfo();
  const updated = {
    startDate: Date.now(),
    totalDays: additionalDays
  };
  localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(updated));
  return getTrialInfo();
};

// --- SEQUENTIAL CUSTOMER ID API ---
export const getNextCustomerId = () => {
  const customers = getCustomers();
  if (!customers || customers.length === 0) return 'CUST-001';
  
  let maxNumber = 0;
  customers.forEach(cust => {
    if (cust.id && typeof cust.id === 'string') {
      const match = cust.id.match(/^CUST-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  });

  const nextNumber = maxNumber + 1;
  return `CUST-${String(nextNumber).padStart(3, '0')}`;
};

// --- STOCK THRESHOLDS API ---
export const getStockThresholds = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.THRESHOLDS);
    return data ? JSON.parse(data) : { low: 5, medium: 15 };
  } catch (e) {
    return { low: 5, medium: 15 };
  }
};

export const saveStockThresholds = (thresholds) => {
  localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(thresholds));
};

// --- CATALOG API ---
export const getCatalog = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATALOG);
    return data ? JSON.parse(data) : DEFAULT_CATALOG;
  } catch (e) {
    return DEFAULT_CATALOG;
  }
};

export const saveCatalog = (catalog) => {
  localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
};

export const updateProductStock = (productId, delta) => {
  const catalog = getCatalog();
  const updated = catalog.map(item => {
    if (item.id === productId) {
      return { ...item, stock: Math.max(0, item.stock + delta) };
    }
    return item;
  });
  saveCatalog(updated);
  return updated;
};

// Bulk import items (CSV / Excel items array)
export const bulkImportProducts = (newItems) => {
  const existingCatalog = getCatalog();
  const nextProducts = [...newItems, ...existingCatalog];
  saveCatalog(nextProducts);
  return nextProducts;
};

// --- CUSTOMERS API ---
export const getCustomers = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomers = (customers) => {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
};

export const addCustomer = (newCustomer) => {
  const customers = getCustomers();
  const updated = [newCustomer, ...customers];
  saveCustomers(updated);
  return updated;
};

export const updateCustomer = (updatedCustomer) => {
  const customers = getCustomers();
  const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
  saveCustomers(updated);
  return updated;
};

export const updateCustomerHistory = (customerId, purchaseRecord) => {
  const customers = getCustomers();
  const updated = customers.map(cust => {
    if (cust.id === customerId) {
      const pastPurchases = [purchaseRecord, ...(cust.pastPurchases || [])];
      const newSpend = (cust.cumulativeSpend || 0) + purchaseRecord.totalPaid;
      const newVisits = (cust.visits || 1) + 1;
      return {
        ...cust,
        visits: newVisits,
        lastVisitDate: new Date().toISOString().split('T')[0],
        lastBuyAmount: purchaseRecord.totalPaid,
        cumulativeSpend: newSpend,
        status: `Rank #${cust.rank} (${newVisits} Visits)`,
        pastPurchases
      };
    }
    return cust;
  });
  saveCustomers(updated);
  return updated;
};

// --- SETTINGS API ---
export const getSettings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = data ? JSON.parse(data) : {};
    
    // Check if account has shop details to preserve
    const account = getAccount();

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      martName: account?.shopName || parsed.martName || DEFAULT_SETTINGS.martName,
      shopAddress: account?.shopAddress || parsed.shopAddress || DEFAULT_SETTINGS.shopAddress,
      helpline: account?.phone || parsed.helpline || DEFAULT_SETTINGS.helpline,
      gstin: account?.gstin || parsed.gstin || DEFAULT_SETTINGS.gstin,
      email: account?.email || parsed.email || DEFAULT_SETTINGS.email,
      milestoneName: parsed.milestoneName || DEFAULT_SETTINGS.milestoneName,
      milestoneEnabled: parsed.milestoneEnabled !== undefined ? parsed.milestoneEnabled : true,
      rankSystemEnabled: parsed.rankSystemEnabled !== undefined ? parsed.rankSystemEnabled : true,
      milestoneTargetAmount: parsed.milestoneTargetAmount !== undefined && Number(parsed.milestoneTargetAmount) > 0 
        ? Number(parsed.milestoneTargetAmount) 
        : 10000,
      milestoneDiscountAmount: parsed.milestoneDiscountAmount !== undefined && Number(parsed.milestoneDiscountAmount) >= 0 
        ? Number(parsed.milestoneDiscountAmount) 
        : 500,
      preferredCameraId: parsed.preferredCameraId || "",
      printerMode: parsed.printerMode || "bluetooth",
      connectedPrinter: parsed.connectedPrinter || "SmartPrint-BT80 (Thermal 80mm)",
      printerStatus: parsed.printerStatus || "connected"
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

// --- SALES API ---
export const getSalesHistory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const recordSale = (saleData) => {
  const sales = getSalesHistory();
  const updated = [saleData, ...sales];
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updated));
  return updated;
};

// Reset Daily Sales / Day End API
export const clearDailySales = () => {
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
  const settings = getSettings();
  const resetRushHours = (settings.rushHours || []).map(h => ({ ...h, footfall: 0, sales: 0 }));
  const updatedSettings = { ...settings, rushHours: resetRushHours };
  saveSettings(updatedSettings);
  return { updatedSettings, sales: [] };
};

// Reset everything to factory defaults (empty customers array)
export const resetToFactoryDefaults = () => {
  localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(DEFAULT_CATALOG));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify({ low: 5, medium: 15 }));
  localStorage.removeItem(STORAGE_KEYS.ACCOUNT);
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS_PASSWORD);
  localStorage.removeItem(STORAGE_KEYS.TRIAL);
  initStorage();
};
