import { World, WorldStatus } from '../types';

export function calculateHarvestTime(
  plantedAtISO: string,
  days: number,
  hours: number,
  minutes: number
): string {
  const plantedTime = new Date(plantedAtISO).getTime();
  if (isNaN(plantedTime)) return new Date().toISOString();

  const totalMs =
    ((Number(days) || 0) * 86400 +
      (Number(hours) || 0) * 3600 +
      (Number(minutes) || 0) * 60) *
    1000;

  return new Date(plantedTime + totalMs).toISOString();
}

export function getWorldStatus(world: World, currentTimeMs: number = Date.now()): WorldStatus {
  if (world.isEmpty || !world.plantedAt || !world.harvestAt) {
    return 'empty';
  }
  const harvestTime = new Date(world.harvestAt).getTime();
  if (isNaN(harvestTime)) return 'empty';
  if (currentTimeMs >= harvestTime) {
    // If it has been ready for more than 12 hours, mark as overdue / terlambat
    const diffHours = (currentTimeMs - harvestTime) / 3600000;
    if (diffHours >= 12) {
      return 'overdue';
    }
    return 'ready';
  }
  return 'growing';
}

export interface CountdownInfo {
  status: WorldStatus;
  isReady: boolean;
  isOverdue: boolean;
  formatted: string;
  diffMs: number;
  progressPercent: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getCountdownInfo(world: World, currentTimeMs: number = Date.now()): CountdownInfo {
  const status = getWorldStatus(world, currentTimeMs);

  if (status === 'empty') {
    return {
      status: 'empty',
      isReady: false,
      isOverdue: false,
      formatted: 'Farm Kosong (Belum Ditanam)',
      diffMs: 0,
      progressPercent: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  const plantedMs = new Date(world.plantedAt).getTime();
  const harvestMs = new Date(world.harvestAt).getTime();
  const totalDuration = Math.max(1, harvestMs - plantedMs);
  const elapsed = currentTimeMs - plantedMs;
  const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  const diffMs = harvestMs - currentTimeMs;

  if (status === 'overdue') {
    const overdueMs = currentTimeMs - harvestMs;
    const h = Math.floor(overdueMs / 3600000);
    const m = Math.floor((overdueMs % 3600000) / 60000);
    return {
      status,
      isReady: true,
      isOverdue: true,
      formatted: `Terlambat +${h}j ${m}m`,
      diffMs,
      progressPercent: 100,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  if (status === 'ready') {
    return {
      status,
      isReady: true,
      isOverdue: false,
      formatted: 'Siap Panen!',
      diffMs: 0,
      progressPercent: 100,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  // Growing
  const absDiff = Math.max(0, diffMs);
  const days = Math.floor(absDiff / 86400000);
  const hours = Math.floor((absDiff % 86400000) / 3600000);
  const minutes = Math.floor((absDiff % 3600000) / 60000);
  const seconds = Math.floor((absDiff % 60000) / 1000);

  let formatted = '';
  if (days > 0) {
    formatted = `${days}h ${hours}j ${minutes}m`;
  } else if (hours > 0) {
    formatted = `${hours}j ${minutes}m ${seconds}d`;
  } else {
    formatted = `${minutes}m ${seconds}d`;
  }

  return {
    status: 'growing',
    isReady: false,
    isOverdue: false,
    formatted,
    diffMs,
    progressPercent: Math.round(progressPercent),
    days,
    hours,
    minutes,
    seconds
  };
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    
    // Format: 03 Nov 2026, 14:30
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return '-';
  }
}

export function formatToInputDateTime(date: Date = new Date()): string {
  // Format for <input type="datetime-local" />: YYYY-MM-DDTHH:mm
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
