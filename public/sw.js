// Service Worker for AgriAdvisor PWA
const CACHE_NAME = 'agri-advisor-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});


self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        
        if (response) {
          return response;
        }
        
        
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});


self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    
    const pendingData = await getPendingData();
    
    
    for (const item of pendingData) {
      try {
        await syncDataItem(item);
        await removePendingData(item.id);
      } catch (error) {
        console.error('Failed to sync item:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}


async function getPendingData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AgriAdvisorDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingSync'], 'readonly');
      const store = transaction.objectStore('pendingSync');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function syncDataItem(item) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item.data)
  });
  
  if (!response.ok) {
    throw new Error('Sync failed');
  }
  
  return response.json();
}

async function removePendingData(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AgriAdvisorDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}
