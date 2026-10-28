/**
 * SmartMart AI — Storage Adapter (Delegating to dataService.js)
 * Maintained for backward compatibility across components.
 */

import {
  dataService,
  maskEmail,
  getActiveSession,
  setActiveSession,
  getAuthUser,
  saveAuthUser,
  clearAuthSession,
  getAccountByEmail,
  saveAccount,
  getManagerPin,
  saveManagerPin,
  getCatalogSync,
  saveCatalog,
  updateProductStock,
  bulkImportProducts,
  getCustomersSync,
  saveCustomers,
  addCustomer,
  updateCustomerHistory,
  getNextCustomerId,
  getStockThresholdsSync,
  saveStockThresholds,
  getSettingsSync,
  saveSettings,
  getSalesHistorySync,
  recordSale,
  clearDailySales
} from './dataService';

export {
  dataService,
  maskEmail,
  getAuthUser,
  saveAuthUser,
  clearAuthSession,
  getManagerPin,
  saveManagerPin
};

// Compatibility methods
export const initStorage = () => {
  // dataService automatically initializes per-tenant isolated storage on demand.
};

export const getAccount = () => {
  return dataService.getAccountSync();
};

export { saveAccount };

export const getTrialInfo = () => {
  // App is 100% Free Forever (No 30-day trial restrictions)
  return {
    startDate: Date.now(),
    totalDays: 99999,
    daysPassed: 0,
    daysRemaining: 99999,
    isExpired: false
  };
};

export const extendTrial = () => {
  return getTrialInfo();
};

export const getSettingsPassword = () => {
  const pin = localStorage.getItem('smartmart_settings_password_v1');
  return pin || null;
};

export const saveSettingsPassword = (pwd) => {
  localStorage.setItem('smartmart_settings_password_v1', pwd);
};

export const getCatalog = () => getCatalogSync();
export { saveCatalog, updateProductStock, bulkImportProducts };

export const getCustomers = () => getCustomersSync();
export { saveCustomers, addCustomer, updateCustomerHistory };

export const getNextCustomerIdSync = () => {
  const customers = getCustomersSync();
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
  return `CUST-${String(maxNumber + 1).padStart(3, '0')}`;
};

export { getNextCustomerId };

export const getStockThresholds = () => getStockThresholdsSync();
export { saveStockThresholds };

export const getSettings = () => getSettingsSync();
export { saveSettings };

export const getSalesHistory = () => getSalesHistorySync();
export { recordSale, clearDailySales };

export const resetToFactoryDefaults = () => {
  const email = dataService.getCurrentUserEmail();
  if (email) {
    saveCatalog([], email);
    saveCustomers([], email);
    saveSalesHistory([], email);
  }
};
