/**
 * CSV Export Utilities for Growtopia Farm Manager
 * Handles proper escaping, RFC 4180 compliance, and UTF-8 BOM for Microsoft Excel compatibility.
 */

import { World, FarmSaleRecord, GrowAccount } from '../types';
import { getWorldStatus, getCountdownInfo, formatDateTime } from './time';

/**
 * Escapes a cell value for CSV format.
 * If the value contains commas, quotes, or newlines, it wraps it in double quotes and escapes existing quotes.
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts rows array into CSV string with UTF-8 BOM so Excel opens it with proper character encoding.
 */
function convertToCsv(headers: string[], rows: (string | number | boolean)[][]): string {
  const headerRow = headers.map(escapeCsvCell).join(',');
  const dataRows = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  // Include UTF-8 BOM (\uFEFF) so Excel respects UTF-8 without garbled characters
  return `\uFEFF${headerRow}\r\n${dataRows}`;
}

/**
 * Triggers a browser download for a CSV string.
 */
export function downloadCsv(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a timestamp into YYYY-MM-DD_HHmm for filenames.
 */
function getTimestampForFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/**
 * Export Worlds list to CSV.
 */
export function exportWorldsToCsv(
  worlds: World[],
  accounts: GrowAccount[],
  currentTimeMs: number = Date.now()
): void {
  const headers = [
    'Nama World',
    'Status World',
    'Status Detail',
    'Jenis Tanaman',
    'Jumlah Pohon',
    'Akun Terkait',
    'Tanggal & Waktu Tanam',
    'Perkiraan Waktu Panen',
    'Sisa Waktu Panen',
    'Persentase Tumbuh (%)',
    'Total Panen (Kali)',
    'Catatan World',
    'ID World',
  ];

  const getAccountGrowId = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    return acc ? acc.growId : (accountId ? accountId : '-');
  };

  const rows = worlds.map((w) => {
    const status = getWorldStatus(w, currentTimeMs);
    const countdown = getCountdownInfo(w, currentTimeMs);

    let statusLabel = 'Sedang Tumbuh';
    if (status === 'ready') statusLabel = 'Siap Panen';
    else if (status === 'overdue') statusLabel = 'Terlambat Panen';
    else if (status === 'empty') statusLabel = 'Farm Kosong';

    const plantedFormatted = status === 'empty' ? '-' : formatDateTime(w.plantedAt);
    const harvestFormatted = status === 'empty' ? '-' : formatDateTime(w.harvestAt);
    const countdownText = status === 'empty' ? 'Farm Kosong' : countdown.formatted;
    const progressVal = status === 'empty' ? 0 : countdown.progressPercent;

    return [
      w.name,
      statusLabel,
      status,
      status === 'empty' ? '-' : w.cropType,
      w.treeCount || 0,
      getAccountGrowId(w.accountId),
      plantedFormatted,
      harvestFormatted,
      countdownText,
      progressVal,
      w.harvestCount || 0,
      w.notes || '',
      w.id,
    ];
  });

  const csv = convertToCsv(headers, rows);
  const fileName = `growtopia_worlds_${getTimestampForFilename()}.csv`;
  downloadCsv(csv, fileName);
}

/**
 * Export Sales History to CSV.
 */
export function exportSalesRecordsToCsv(
  records: FarmSaleRecord[]
): void {
  const headers = [
    'Tanggal Transaksi',
    'Judul Transaksi',
    'Kategori',
    'Item Terjual',
    'Jumlah',
    'Satuan',
    'Total Pendapatan (WL)',
    'Setara Diamond Lock (DL)',
    'Patokan / Rasio Harga',
    'Nama Pembeli',
    'World Transaksi',
    'Catatan Transaksi',
    'ID Transaksi',
  ];

  const categoryLabels: Record<string, string> = {
    gems: 'Gems',
    seed: 'Bibit (Seeds)',
    block: 'Blok (Blocks)',
    pack: 'Item Pack',
    lock: 'Lock / DL',
    other: 'Lainnya',
  };

  const rows = records.map((r) => {
    let dateFormatted = r.date;
    try {
      dateFormatted = new Date(r.date || r.createdAt).toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      // keep fallback
    }

    const categoryText = categoryLabels[r.category] || r.category;
    const dlAmount = ((r.revenueWl || 0) / 100).toFixed(2);

    return [
      dateFormatted,
      r.title || '',
      categoryText,
      r.itemSold || '',
      r.quantity || 0,
      r.quantityUnit || 'Pcs',
      r.revenueWl || 0,
      dlAmount,
      r.priceRate || '-',
      r.buyerName || '-',
      r.worldName || '-',
      r.notes || '',
      r.id,
    ];
  });

  const csv = convertToCsv(headers, rows);
  const fileName = `growtopia_sales_history_${getTimestampForFilename()}.csv`;
  downloadCsv(csv, fileName);
}
