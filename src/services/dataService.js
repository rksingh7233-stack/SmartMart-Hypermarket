import { DEFAULT_SETTINGS } from '../data/defaultSettings';

/**
 * SmartMart AI — Modular Backend-Ready Data Service
 * 
 * Centralizes all data persistence with strict multi-tenant isolation per user email.
 * For new user registrations, accounts are 100% clean and blank (0 catalog items, 0 customers).
 * Provides async API methods ready to be swapped with a real Node.js / Cloud REST backend.
 */

const REGISTRY_KEYS = {
  ACCOUNTS: 'smartmart_accounts_registry_v2',
  ACTIVE_SESSION: 'smartmart_active_session_v2',
  DEMO_ACCOUNT: 'smartmart_demo_initialized_v2'
};

// Normalize email for storage key namespacing
const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return 'guest';
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
};

// Get current active session
export const getActiveSession = () => {
  try {
    const raw = localStorage.getItem(REGISTRY_KEYS.ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

// Set active session
export const setActiveSession = (session) => {
  if (!session) {
    localStorage.removeItem(REGISTRY_KEYS.ACTIVE_SESSION);
  } else {
    localStorage.setItem(REGISTRY_KEYS.ACTIVE_SESSION, JSON.stringify(session));
  }
};

// Get current user email from active session
export const getCurrentUserEmail = () => {
  const session = getActiveSession();
  return session?.email || null;
};

// Build tenant-isolated key for current user
const getTenantKey = (baseKey, targetEmail = null) => {
  const email = targetEmail || getCurrentUserEmail() || 'guest';
  return `smartmart_tenant_${normalizeEmail(email)}_${baseKey}`;
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

// --- ACCOUNTS REGISTRY ---

export const getAllAccounts = async () => {
  try {
    const raw = localStorage.getItem(REGISTRY_KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const getAccountByEmail = async (email) => {
  if (!email) return null;
  const accounts = await getAllAccounts();
  return accounts[email.trim().toLowerCase()] || null;
};

export const saveAccount = async (accountData) => {
  if (!accountData || !accountData.email) return null;
  const emailKey = accountData.email.trim().toLowerCase();
  const accounts = await getAllAccounts();

  const newAccount = {
    ...accountData,
    email: emailKey,
    updatedAt: Date.now()
  };

  accounts[emailKey] = newAccount;
  localStorage.setItem(REGISTRY_KEYS.ACCOUNTS, JSON.stringify(accounts));

  // Initialize tenant settings if not already present
  const currentSettings = await getSettings(emailKey);
  const updatedSettings = {
    ...currentSettings,
    martName: accountData.shopName || currentSettings.martName,
    shopAddress: accountData.shopAddress || currentSettings.shopAddress,
    helpline: accountData.phone || currentSettings.helpline,
    gstin: accountData.gstin || currentSettings.gstin,
    email: emailKey
  };
  await saveSettings(updatedSettings, emailKey);

  return newAccount;
};

// --- AUTH SESSION ---

export const getAuthUser = () => {
  return getActiveSession();
};

export const saveAuthUser = (user) => {
  setActiveSession(user);
};

export const clearAuthSession = () => {
  setActiveSession(null);
};

// --- MANAGER SECURITY PIN / PASSWORD ---

export const getManagerPin = async (email = null) => {
  const key = getTenantKey('manager_pin', email);
  try {
    return localStorage.getItem(key) || null;
  } catch (e) {
    return null;
  }
};

export const saveManagerPin = async (pin, email = null) => {
  const key = getTenantKey('manager_pin', email);
  localStorage.setItem(key, pin);
  return pin;
};

// --- CATALOG / INVENTORY (STRICT MULTI-TENANT: 0 ITEMS FOR NEW ACCOUNTS) ---

export const getCatalog = async (email = null) => {
  const key = getTenantKey('catalog', email);
  try {
    const data = localStorage.getItem(key);
    // 100% clean & blank for new accounts: return empty array []
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveCatalog = async (catalog, email = null) => {
  const key = getTenantKey('catalog', email);
  localStorage.setItem(key, JSON.stringify(catalog));
  return catalog;
};

export const updateProductStock = async (productId, delta, email = null) => {
  const catalog = await getCatalog(email);
  const updated = catalog.map(item => {
    if (item.id === productId) {
      return { ...item, stock: Math.max(0, item.stock + delta) };
    }
    return item;
  });
  await saveCatalog(updated, email);
  return updated;
};

export const bulkImportProducts = async (newItems, email = null) => {
  const existing = await getCatalog(email);
  const merged = [...newItems, ...existing];
  await saveCatalog(merged, email);
  return merged;
};

// --- CUSTOMERS (STRICT MULTI-TENANT: 0 CUSTOMERS FOR NEW ACCOUNTS) ---

export const getCustomers = async (email = null) => {
  const key = getTenantKey('customers', email);
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomers = async (customers, email = null) => {
  const key = getTenantKey('customers', email);
  localStorage.setItem(key, JSON.stringify(customers));
  return customers;
};

export const addCustomer = async (newCustomer, email = null) => {
  const customers = await getCustomers(email);
  const updated = [newCustomer, ...customers];
  await saveCustomers(updated, email);
  return updated;
};

export const updateCustomerHistory = async (customerId, purchaseRecord, email = null) => {
  const customers = await getCustomers(email);
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
        pastPurchases
      };
    }
    return cust;
  });
  await saveCustomers(updated, email);
  return updated;
};

export const getNextCustomerId = async (email = null) => {
  const customers = await getCustomers(email);
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

// --- STOCK THRESHOLDS ---

export const getStockThresholds = async (email = null) => {
  const key = getTenantKey('thresholds', email);
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { low: 5, medium: 15 };
  } catch (e) {
    return { low: 5, medium: 15 };
  }
};

export const saveStockThresholds = async (thresholds, email = null) => {
  const key = getTenantKey('thresholds', email);
  localStorage.setItem(key, JSON.stringify(thresholds));
  return thresholds;
};

// --- SETTINGS ---

export const getSettings = async (email = null) => {
  const key = getTenantKey('settings', email);
  const targetEmail = email || getCurrentUserEmail();
  let account = null;
  if (targetEmail) {
    account = await getAccountByEmail(targetEmail);
  }

  try {
    const data = localStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : {};

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      martName: account?.shopName || parsed.martName || DEFAULT_SETTINGS.martName,
      shopAddress: account?.shopAddress || parsed.shopAddress || DEFAULT_SETTINGS.shopAddress,
      helpline: account?.phone || parsed.helpline || DEFAULT_SETTINGS.helpline,
      gstin: account?.gstin || parsed.gstin || DEFAULT_SETTINGS.gstin,
      email: account?.email || parsed.email || targetEmail || DEFAULT_SETTINGS.email,
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

export const saveSettings = async (settings, email = null) => {
  const key = getTenantKey('settings', email);
  localStorage.setItem(key, JSON.stringify(settings));
  return settings;
};

// --- SALES HISTORY & P&L ---

export const getSalesHistory = async (email = null) => {
  const key = getTenantKey('sales', email);
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const recordSale = async (saleData, email = null) => {
  const sales = await getSalesHistory(email);
  const updated = [saleData, ...sales];
  const key = getTenantKey('sales', email);
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
};

export const clearDailySales = async (email = null) => {
  const key = getTenantKey('sales', email);
  localStorage.setItem(key, JSON.stringify([]));
  const settings = await getSettings(email);
  const resetRushHours = (settings.rushHours || []).map(h => ({ ...h, footfall: 0, sales: 0 }));
  const updatedSettings = { ...settings, rushHours: resetRushHours };
  await saveSettings(updatedSettings, email);
  return { updatedSettings, sales: [] };
};

// --- SYNCHRONOUS COMPATIBILITY HELPERS (Direct storage access) ---

export const getCatalogSync = (email = null) => {
  try {
    const key = getTenantKey('catalog', email);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const getCustomersSync = (email = null) => {
  try {
    const key = getTenantKey('customers', email);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const getSettingsSync = (email = null) => {
  const key = getTenantKey('settings', email);
  const targetEmail = email || getCurrentUserEmail();
  let account = null;
  if (targetEmail) {
    try {
      const raw = localStorage.getItem(REGISTRY_KEYS.ACCOUNTS);
      const accounts = raw ? JSON.parse(raw) : {};
      account = accounts[targetEmail.trim().toLowerCase()] || null;
    } catch (e) {}
  }

  try {
    const data = localStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : {};

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      martName: account?.shopName || parsed.martName || DEFAULT_SETTINGS.martName,
      shopAddress: account?.shopAddress || parsed.shopAddress || DEFAULT_SETTINGS.shopAddress,
      helpline: account?.phone || parsed.helpline || DEFAULT_SETTINGS.helpline,
      gstin: account?.gstin || parsed.gstin || DEFAULT_SETTINGS.gstin,
      email: account?.email || parsed.email || targetEmail || DEFAULT_SETTINGS.email,
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

export const getSalesHistorySync = (email = null) => {
  try {
    const key = getTenantKey('sales', email);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const getStockThresholdsSync = (email = null) => {
  try {
    const key = getTenantKey('thresholds', email);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { low: 5, medium: 15 };
  } catch (e) {
    return { low: 5, medium: 15 };
  }
};

export const getAccountSync = (email = null) => {
  const targetEmail = email || getCurrentUserEmail();
  if (!targetEmail) return null;
  try {
    const raw = localStorage.getItem(REGISTRY_KEYS.ACCOUNTS);
    const accounts = raw ? JSON.parse(raw) : {};
    return accounts[targetEmail.trim().toLowerCase()] || null;
  } catch (e) {
    return null;
  }
};

// Export unified data service object
export const dataService = {
  maskEmail,
  getActiveSession,
  setActiveSession,
  getCurrentUserEmail,
  getAllAccounts,
  getAccountByEmail,
  saveAccount,
  getAuthUser,
  saveAuthUser,
  clearAuthSession,
  getManagerPin,
  saveManagerPin,
  getCatalog,
  saveCatalog,
  updateProductStock,
  bulkImportProducts,
  getCustomers,
  saveCustomers,
  addCustomer,
  updateCustomerHistory,
  getNextCustomerId,
  getStockThresholds,
  saveStockThresholds,
  getSettings,
  saveSettings,
  getSalesHistory,
  recordSale,
  clearDailySales,
  getCatalogSync,
  getCustomersSync,
  getSettingsSync,
  getSalesHistorySync,
  getStockThresholdsSync,
  getAccountSync
};

export default dataService;
