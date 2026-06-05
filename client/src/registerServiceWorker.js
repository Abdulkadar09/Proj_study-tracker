export default function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered');

        const dispatchSwUpdate = () => {
          if (registration.waiting) {
            const event = new CustomEvent('swUpdate', { detail: { registration } });
            window.dispatchEvent(event);
          }
        };

        if (registration.waiting) {
          dispatchSwUpdate();
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              dispatchSwUpdate();
            }
          });
        });
      } catch (error) {
        console.warn('Service worker registration failed', error);
      }
    });
  }
}
