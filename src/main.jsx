import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA offline caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New POS update available, reloading...');
  },
  onOfflineReady() {
    console.log('Dua Sisi POS is ready to work offline.');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
