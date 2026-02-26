import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force unregister old service workers before starting app
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('Old service worker unregistered');
    });
  });
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
        console.log('Cache deleted:', name);
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);