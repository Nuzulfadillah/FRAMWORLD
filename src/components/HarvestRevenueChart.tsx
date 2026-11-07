import React, { useState, useMemo } from 'react';
import { FarmSaleRecord } from '../types';
import {
  TrendingUp,
  Calendar,
  Coins,
  Award,
  ArrowRight,
  PlusCircle,
  Gem,
  BarChart2,
  Sparkles,
} from 'lucide-react';

interface HarvestRevenueChartProps {
  salesRecords: FarmSaleRecord[];
  onNavigateToCalculator?: () => void;
}

type ChartViewMode = 'daily' | 'weekly';

interface BarDataPoint {
  key: string;
  label: string;
  subLabel: string;
  totalWl: number;
  txCount: number;
  topItem?: string;
  isPeak?: boolean;
  dateRangeText: string;
}

export const HarvestRevenueChart: React.FC<HarvestRevenueChartProps> = ({
  salesRecords = [],
  onNavigateToCalculator,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('daily');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group sales records into Daily (last 7 days) and Weekly (last 4 weeks)
  const chartData = useMemo(() => {
    const now = new Date();
    // Normalize to midnight for clean date comparisons
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 86400000;

    if (viewMode === 'daily') {
      // Last 7 days: from (today - 6 days) to today
      const daysList: BarDataPoint[] = [];
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(todayMidnight - i * oneDayMs);
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;

        const dayName = i === 0 ? 'Hari Ini' : i === 1 ? 'Kemarin' : dayNames[targetDate.getDay()];
        const subLabel = `${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;

        // Find matching records
        const matched = salesRecords.filter((r) => {
          if (!r.date && !r.createdAt) return false;
          const rDate = new Date(r.date || r.createdAt);
          if (isNaN(rDate.getTime())) return false;
          const rY = rDate.getFullYear();
          const rM = String(rDate.getMonth() + 1).padStart(2, '0');
          const rD = String(rDate.getDate()).padStart(2, '0');
          return `${rY}-${rM}-${rD}` === dateKey;
        });

        const totalWl = matched.reduce((acc, r) => acc + (r.revenueWl || 0), 0);
        const topItem = matched.length > 0 ? matched[0].itemSold || matched[0].title : undefined;

        daysList.push({
          key: dateKey,
          label: dayName,
          subLabel,
          totalWl,
          txCount: matched.length,
          topItem,
          dateRangeText: `${dayName}, ${targetDate.getDate()} ${monthNames[targetDate.getMonth()]} ${yyyy}`,
        });
      }

      // Mark peak day
      const maxWl = Math.max(...daysList.map((d) => d.totalWl), 0);
      if (maxWl > 0) {
        daysList.forEach((d) => {
          if (d.totalWl === maxWl) d.isPeak = true;
        });
      }

      return daysList;
    } else {
      // Weekly: Last 4 weeks
      const weeksList: BarDataPoint[] = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let w = 3; w >= 0; w--) {
        const weekEnd = new Date(todayMidnight - w * 7 * oneDayMs + oneDayMs - 1);
        const weekStart = new Date(todayMidnight - (w + 1) * 7 * oneDayMs + oneDayMs);

        const startText = `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]}`;
        const endText = `${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]}`;

        const weekLabel = w === 0 ? 'Minggu Ini' : w === 1 ? '1 Mgg Lalu' : `${w} Mgg Lalu`;
        const subLabel = `${startText} - ${endText}`;

        // Find matching records in this interval
        const matched = salesRecords.filter((r) => {
          if (!r.date && !r.createdAt) return false;
          const rTime = new Date(r.date || r.createdAt).getTime();
          if (isNaN(rTime)) return false;
          return rTime >= weekStart.getTime() && rTime <= weekEnd.getTime();
        });

        const totalWl = matched.reduce((acc, r) => acc + (r.revenueWl || 0), 0);
        const topItem = matched.length > 0 ? matched[0].itemSold || matched[0].title : undefined;

        weeksList.push({
          key: `week-${w}`,
          label: weekLabel,
          subLabel,
          totalWl,
          txCount: matched.length,
          topItem,
          dateRangeText: `Periode: ${startText} s/d ${endText}`,
        });
      }

      const maxWl = Math.max(...weeksList.map((w) => w.totalWl), 0);
      if (maxWl > 0) {
        weeksList.forEach((w) => {
          if (w.totalWl === maxWl) w.isPeak = true;
        });
      }

      return weeksList;
    }
  }, [salesRecords, viewMode]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalPeriodWl = chartData.reduce((acc, d) => acc + d.totalWl, 0);
    const totalPeriodTx = chartData.reduce((acc, d) => acc + d.txCount, 0);
    const count = chartData.length;
    const avgWl = count > 0 ? Math.round(totalPeriodWl / count) : 0;
    const peakPoint = chartData.find((d) => d.isPeak);
    const totalDl = (totalPeriodWl / 100).toFixed(2);

    return {
      totalPeriodWl,
      totalDl,
      totalPeriodTx,
      avgWl,
      peakPoint,
    };
  }, [chartData]);

  const maxVal = Math.max(...chartData.map((d) => d.totalWl), 10);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0c1626] via-[#0f1d33] to-[#0a1424] border border-slate-700/80 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-100 font-game tracking-wider uppercase flex items-center gap-2">
              <span>STATISTIK PENDAPATAN FARMING</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                DIAGRAM PANEN
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Tren total panen & penjualan gems/seed ({viewMode === 'daily' ? '7 hari terakhir' : '4 minggu terakhir'}) dari catatan transaksi Anda
          </p>
        </div>

        {/* View Toggle & Calculator Shortcut */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#070d1a] border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'daily'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📊 Harian (7 Hari)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'weekly'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📅 Mingguan (4 Mgg)</span>
            </button>
          </div>

          {onNavigateToCalculator && (
            <button
              type="button"
              onClick={onNavigateToCalculator}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Catat Penjualan</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        {/* Total WL Periode Ini */}
        <div className="p-3.5 rounded-2xl bg-[#0a1222] border border-slate-800/90 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Pendapatan ({viewMode === 'daily' ? '7 Hari' : '4 Minggu'})
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-game mt-0.5">
              {stats.totalPeriodWl.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">WL</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">
              ≈ {stats.totalDl} Diamond Lock (DL)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Rata-rata per hari / minggu */}
        <div className="p-3.5 rounded-2xl bg-[#0a1222] border border-slate-800/90 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Rata-rata {viewMode === 'daily' ? 'Per Hari' : 'Per Minggu'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-100 font-game mt-0.5">
              ~{stats.avgWl.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">WL</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {stats.totalPeriodTx} total transaksi panen
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Puncak Pendapatan Tertinggi */}
        <div className="p-3.5 rounded-2xl bg-[#0a1222] border border-slate-800/90 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Puncak Panen Tertinggi
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-game mt-0.5">
              {stats.peakPoint ? `${stats.peakPoint.totalWl.toLocaleString()} WL` : '0 WL'}
            </div>
            <span className="text-[10px] text-amber-300 font-semibold truncate block max-w-[170px]">
              {stats.peakPoint ? `🏆 ${stats.peakPoint.label} (${stats.peakPoint.subLabel})` : 'Belum ada transaksi'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="relative z-10 pt-4">
        {/* Chart Container */}
        <div className="h-56 sm:h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 pt-8 pb-3 bg-[#080f1e]/90 rounded-2xl border border-slate-800/80 relative">
          {/* Subtle Grid Lines */}
          <div className="absolute inset-x-0 top-8 border-b border-dashed border-slate-800/60 pointer-events-none" />
          <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-800/60 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-12 border-b border-dashed border-slate-800/60 pointer-events-none" />

          {chartData.map((item, idx) => {
            const heightPercent = maxVal > 0 ? Math.max(6, Math.round((item.totalWl / maxVal) * 88)) : 6;
            const isHovered = hoveredIndex === idx;
            const hasData = item.totalWl > 0;

            return (
              <div
                key={item.key}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-16 z-30 px-3 py-2 rounded-xl bg-[#0d182b] border border-amber-400/50 shadow-2xl text-center whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                    <div className="text-[11px] font-bold text-amber-300 font-game">
                      {item.dateRangeText}
                    </div>
                    <div className="text-xs font-black text-white flex items-center justify-center gap-1">
                      <span>{item.totalWl.toLocaleString()} WL</span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        (~{(item.totalWl / 100).toFixed(2)} DL)
                      </span>
                    </div>
                    {item.txCount > 0 && (
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {item.txCount} penjualan {item.topItem ? `• ${item.topItem}` : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* Amount on top of bar */}
                <div
                  className={`text-[10px] sm:text-xs font-bold font-mono transition-all duration-200 mb-1.5 ${
                    hasData
                      ? item.isPeak
                        ? 'text-amber-300 font-black scale-105'
                        : 'text-emerald-300'
                      : 'text-slate-600'
                  }`}
                >
                  {hasData ? `${item.totalWl}w` : '0'}
                </div>

                {/* The Bar */}
                <div className="w-full max-w-[48px] flex items-end justify-center h-[160px]">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xl transition-all duration-300 relative ${
                      hasData
                        ? item.isPeak
                          ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 shadow-lg shadow-amber-500/25 ring-1 ring-amber-400'
                          : 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 shadow-md shadow-emerald-500/20 group-hover:from-emerald-500 group-hover:to-teal-300'
                        : 'bg-slate-800/60 border border-slate-700/50 group-hover:bg-slate-700/60'
                    } ${isHovered ? 'scale-y-[1.03] filter brightness-110' : ''}`}
                  >
                    {/* Peak Crown / Badge */}
                    {item.isPeak && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">
                        👑
                      </span>
                    )}
                  </div>
                </div>

                {/* X-Axis Labels */}
                <div className="mt-2 text-center">
                  <span
                    className={`block text-[11px] sm:text-xs font-bold leading-tight ${
                      isHovered
                        ? 'text-amber-300'
                        : item.isPeak
                        ? 'text-emerald-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="block text-[9px] text-slate-500 font-medium">
                    {item.subLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
