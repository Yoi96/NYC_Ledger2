// register-sw.js — simple service worker registration with update handling
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    // When a new Service Worker is found, listen for state changes
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available — ask it to skip waiting so it becomes active immediately
            newSW.postMessage({ type: 'SKIP_WAITING' });
          } else {
            // First install — nothing to do. You could show a toast saying "App is ready offline".
            console.log('Service Worker installed for the first time.');
          }
        }
      });
    });
  }).catch(err => console.error('Service Worker registration failed:', err));
}
