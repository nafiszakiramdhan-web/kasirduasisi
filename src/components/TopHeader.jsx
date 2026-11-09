import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, HardDrive, Calendar } from 'lucide-react';
import { formatRupiah, DEFAULT_LOGO_URL } from '../utils/formatters';

export default function TopHeader({ 
  todayRevenue = 0
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format today's date elegantly
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-[#18181b]/95 backdrop-blur border-b border-pos-border px-4 py-2.5 shadow-md">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-amber-500/40 bg-zinc-900 flex-shrink-0 shadow-sm">
            <img 
              src={DEFAULT_LOGO_URL} 
              alt="Dua Sisi" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center font-bold text-amber-500 text-xs">DS</div>';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight text-white truncate">Dua Sisi</h1>
              <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">POS</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-none truncate">Coffee & Roastery</p>
          </div>
        </div>

        {/* Right: Elegant Date Pill & Revenue Pill */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Elegant Date Badge */}
          <div className="hidden xs:flex flex-col items-end bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-right">
            <div className="flex items-center gap-1 text-[9px] font-semibold text-amber-400 uppercase tracking-wide leading-none">
              <Calendar className="w-2.5 h-2.5" />
              <span>Hari Ini</span>
            </div>
            <span className="text-[11px] font-medium text-zinc-300 leading-tight">
              {todayFormatted}
            </span>
          </div>

          {/* Today's Omzet Pill */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-right">
            <span className="block text-[9px] font-medium text-zinc-400 uppercase tracking-wider leading-none">Omzet</span>
            <span className="text-xs font-bold text-emerald-400 leading-tight">
              {formatRupiah(todayRevenue)}
            </span>
          </div>

          {/* Offline Local Storage Indicator */}
          <div 
            title="Penyimpanan Lokal IndexedDB (Dexie.js) Aktif"
            className="p-2 rounded-lg bg-zinc-900 text-amber-400 border border-zinc-800 flex items-center justify-center"
          >
            <HardDrive className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="mt-1.5 bg-amber-500/15 border border-amber-500/30 rounded-md px-2 py-1 flex items-center justify-between text-[11px] text-amber-300">
          <div className="flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Mode Offline PWA Aktif (Data aman di IndexedDB)</span>
          </div>
          <span className="text-[10px] font-mono bg-amber-500/20 px-1 rounded">Dexie DB</span>
        </div>
      )}
    </header>
  );
}
