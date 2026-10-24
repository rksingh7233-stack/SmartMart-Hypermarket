// Sync Service using BroadcastChannel & window.storage for 100% frontend POS-to-Customer Screen synchronization

const CHANNEL_NAME = 'smartmart_sync';
const STORAGE_KEY = 'smartmart_live_sync_state';

class SyncService {
  constructor() {
    this.channel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
      ? new BroadcastChannel(CHANNEL_NAME) 
      : null;
    this.listeners = new Set();

    if (this.channel) {
      this.channel.onmessage = (event) => {
        this.notify(event.data);
      };
    }

    // Also listen to storage events as redundant sync across tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notify(data);
          } catch (err) {
            console.warn("Storage sync parse error:", err);
          }
        }
      });
    }
  }

  // Publish state from Cashier POS
  publish(data) {
    const packet = {
      ...data,
      timestamp: Date.now()
    };

    // 1. BroadcastChannel (instant in-memory communication)
    if (this.channel) {
      try {
        this.channel.postMessage(packet);
      } catch (e) {
        console.warn("BroadcastChannel error:", e);
      }
    }

    // 2. localStorage persistence (cross-window storage event fallback & initial state for new tabs)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packet));
    } catch (e) {
      console.warn("localStorage sync error:", e);
    }
  }

  // Subscribe on Customer Display
  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify(data) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error("Sync listener error:", e);
      }
    });
  }

  // Get current snapshot for initial render
  getLatestState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
}

export const syncService = new SyncService();
