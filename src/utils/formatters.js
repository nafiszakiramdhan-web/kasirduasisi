export function formatRupiah(amount) {
  const number = Number(amount) || 0;
  return 'Rp ' + number.toLocaleString('id-ID');
}

export function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' WIB';
}

export function formatTimeOnly(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' WIB';
}

export function getDurationFromNow(isoString) {
  if (!isoString) return '-';
  const start = new Date(isoString);
  const now = new Date();
  const diffMs = Math.max(0, now - start);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} hari ${diffHours % 24} jam lalu`;
  }
  if (diffHours > 0) {
    return `${diffHours} jam ${diffMins % 60} menit lalu`;
  }
  if (diffMins > 0) {
    return `${diffMins} menit lalu`;
  }
  return 'Baru saja';
}

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateTrxNumber() {
  const date = new Date();
  const yr = String(date.getFullYear()).slice(-2);
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const dy = String(date.getDate()).padStart(2, '0');
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `DS-${yr}${mo}${dy}-${rnd}`;
}

export const DEFAULT_LOGO_URL = `${import.meta.env.BASE_URL}assets/logoduasisi.jpg`;
