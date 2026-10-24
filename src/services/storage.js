import { DEFAULT_CATALOG } from '../data/defaultCatalog';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';

const STORAGE_KEYS = {
  CATALOG: 'smartmart_catalog_v2',
  CUSTOMERS: 'smartmart_customers_v2', // v2 to guarantee clean empty customer array []
  SETTINGS: 'smartmart_settings_v2',
  SALES: 'smartmart_sales_history_v2',
  THRESHOLDS: 'smartmart_stock_thresholds'
};

// Initializer to load defaults if empty
export const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.CATALOG)) {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(DEFAULT_CATALOG));
  }
  // Guarantee starting with an EMPTY customer array [] (zero dummy/example data)
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
};

// Stock Thresholds API
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

// Catalog API
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

// Customers API
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

// Settings API
export const getSettings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      milestoneTargetAmount: parsed.milestoneTargetAmount !== undefined && Number(parsed.milestoneTargetAmount) > 0 
        ? Number(parsed.milestoneTargetAmount) 
        : 10000,
      milestoneDiscountAmount: parsed.milestoneDiscountAmount !== undefined && Number(parsed.milestoneDiscountAmount) >= 0 
        ? Number(parsed.milestoneDiscountAmount) 
        : 500
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

// Sales API
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
  // Reset rush hours footfall & sales counts in settings to 0
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
  initStorage();
};
