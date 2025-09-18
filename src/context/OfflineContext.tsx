import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface OfflineData {
  id: string;
  type: 'diagnosis' | 'irrigation' | 'market' | 'user_data';
  data: any;
  timestamp: number;
  synced: boolean;
}

interface OfflineContextType {
  isOnline: boolean;
  pendingSync: OfflineData[];
  saveOfflineData: (type: string, data: any) => Promise<void>;
  syncPendingData: () => Promise<void>;
  getOfflineData: (type: string) => Promise<OfflineData[]>;
  clearSyncedData: () => Promise<void>;
  toggleOnlineMode: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([]);
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [forceOffline, setForceOffline] = useState(false);

  useEffect(() => {
    // Initialize IndexedDB
    const initDB = async () => {
      try {
        const database = await openDB('AgriAdvisorDB', 1, {
          upgrade(db) {
            // Create object stores
            if (!db.objectStoreNames.contains('offlineData')) {
              const offlineStore = db.createObjectStore('offlineData', {
                keyPath: 'id',
                autoIncrement: true,
              });
              offlineStore.createIndex('type', 'type');
              offlineStore.createIndex('timestamp', 'timestamp');
              offlineStore.createIndex('synced', 'synced');
            }

            if (!db.objectStoreNames.contains('pendingSync')) {
              db.createObjectStore('pendingSync', {
                keyPath: 'id',
                autoIncrement: true,
              });
            }

            if (!db.objectStoreNames.contains('cache')) {
              const cacheStore = db.createObjectStore('cache', {
                keyPath: 'key',
              });
              cacheStore.createIndex('timestamp', 'timestamp');
            }
          },
        });
        setDb(database);
        
        // Load pending sync data
        const pending = await database.getAll('pendingSync');
        setPendingSync(pending);
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };

    initDB();

    // Online/offline event listeners
    const handleOnline = () => {
      if (!forceOffline) {
        setIsOnline(true);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forceOffline]);

  const toggleOnlineMode = () => {
    setForceOffline(!forceOffline);
    if (forceOffline) {
      // Re-enabling online mode
      setIsOnline(navigator.onLine);
    } else {
      // Forcing offline mode
      setIsOnline(false);
    }
  };

  const saveOfflineData = async (type: string, data: any): Promise<void> => {
    if (!db) return;

    try {
      const offlineData: OfflineData = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type as any,
        data,
        timestamp: Date.now(),
        synced: false,
      };

      // Save to offline data store
      await db.add('offlineData', offlineData);

      // Add to pending sync if offline
      if (!isOnline) {
        await db.add('pendingSync', offlineData);
        setPendingSync(prev => [...prev, offlineData]);
      } else {
        // Try to sync immediately if online
        await syncDataItem(offlineData);
      }
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  };

  const syncDataItem = async (item: OfflineData): Promise<boolean> => {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          type: item.type,
          data: item.data,
          timestamp: item.timestamp,
        }),
      });

      if (response.ok) {
        // Mark as synced in IndexedDB
        if (db) {
          const updatedItem = { ...item, synced: true };
          await db.put('offlineData', updatedItem);
          await db.delete('pendingSync', item.id);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to sync data item:', error);
      return false;
    }
  };

  const syncPendingData = async (): Promise<void> => {
    if (!isOnline || !db || pendingSync.length === 0) return;

    try {
      const syncPromises = pendingSync.map(async (item) => {
        const success = await syncDataItem(item);
        return { item, success };
      });

      const results = await Promise.all(syncPromises);
      
      // Update pending sync list
      const stillPending = results
        .filter(result => !result.success)
        .map(result => result.item);
      
      setPendingSync(stillPending);

      // Register background sync if supported
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        // Type assertion for background sync API
        const syncManager = (registration as any).sync;
        if (syncManager) {
          await syncManager.register('background-sync');
        }
      }
    } catch (error) {
      console.error('Failed to sync pending data:', error);
    }
  };

  const getOfflineData = async (type: string): Promise<OfflineData[]> => {
    if (!db) return [];

    try {
      const tx = db.transaction('offlineData', 'readonly');
      const index = tx.store.index('type');
      return await index.getAll(type);
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return [];
    }
  };

  const clearSyncedData = async (): Promise<void> => {
    if (!db) return;

    try {
      const tx = db.transaction('offlineData', 'readwrite');
      const store = tx.store;
      const syncedIndex = store.index('synced');
      const syncedItems = await syncedIndex.getAll(IDBKeyRange.only(true));
      
      for (const item of syncedItems) {
        // Keep recent data (last 7 days) even if synced
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (item.timestamp < weekAgo) {
          await store.delete(item.id);
        }
      }
    } catch (error) {
      console.error('Failed to clear synced data:', error);
    }
  };

  const value: OfflineContextType = {
    isOnline,
    pendingSync,
    saveOfflineData,
    syncPendingData,
    getOfflineData,
    clearSyncedData,
    toggleOnlineMode,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};
