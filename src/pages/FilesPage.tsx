import React, { useState, useRef } from 'react';
import { FarmFile, World, GrowAccount, FarmSaleRecord } from '../types';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { formatDateTime, formatFileSize } from '../utils/time';
import { exportWorldsToCsv, exportSalesRecordsToCsv } from '../utils/csvExport';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Download,
  Trash2,
  Tag,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';

interface FilesPageProps {
  files: FarmFile[];
  worlds?: World[];
  accounts?: GrowAccount[];
  salesRecords?: FarmSaleRecord[];
  onOpenUploadModal: () => void;
  onDirectUpload: (fileData: Omit<FarmFile, 'id' | 'uploadDate'>) => void;
  onDeleteFile: (fileId: string) => void;
}

export const FilesPage: React.FC<FilesPageProps> = ({
  files,
  worlds = [],
  accounts = [],
  salesRecords = [],
  onOpenUploadModal,
  onDirectUpload,
  onDeleteFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [dragActive, setDragActive] = useState(false);
  const [exportNotification, setExportNotification] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FarmFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collect all unique tags
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      f.tags.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [files]);

  // Handle direct drag drop onto header
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'other';
    let fileType: FarmFile['type'] = 'other';
    if (ext === 'pdf') fileType = 'pdf';
    else if (ext === 'xlsx') fileType = 'xlsx';
    else if (ext === 'xls') fileType = 'xls';
    else if (ext === 'csv') fileType = 'csv';

    const reader = new FileReader();
    reader.onload = (e) => {
      onDirectUpload({
        name: file.name,
        type: fileType,
        size: file.size,
        tags: ['dokumen baru'],
        dataUrl: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (file: FarmFile) => {
    // If we have dataUrl, download it directly
    if (file.dataUrl) {
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create a dummy template text file for demo files so download always succeeds
      const dummyContent = `Growtopia Farm Manager File: ${file.name}\nCatatan: ${file.notes || 'Dokumen farming Growtopia'}\nTanggal: ${file.uploadDate}`;
      const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Filter files
  const filteredFiles = files.filter((f) => {
    if (selectedTag !== 'all' && !f.tags.includes(selectedTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchTags = f.tags.some((t) => t.toLowerCase().includes(q));
      const matchNotes = (f.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchTags && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 font-game tracking-wider uppercase flex items-center gap-2">
            <span>BERKAS & DOKUMEN FARMING</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
              {files.length} Berkas
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Unggah dan kelola lembar kerja Excel (harga seed/kalkulator) dan PDF strategi farming
          </p>
        </div>

        <button
          onClick={onOpenUploadModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload File Baru</span>
        </button>
      </div>

      {/* Drag and Drop Upload Area as requested */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
            : 'border-slate-700/80 bg-[#0d162a]/70 hover:border-cyan-500/50 hover:bg-[#0f1a33]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-3 shadow-inner">
            <UploadCloud className="w-7 h-7 animate-bounce" />
          </div>
          <h3 className="text-base font-bold text-slate-200 font-game tracking-wider">
            AREA UPLOAD BERKAS (DRAG & DROP)
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Seret dan lepas file <strong className="text-rose-400">PDF</strong> atau spreadsheet{' '}
            <strong className="text-emerald-400">Excel (.xlsx, .xls)</strong> ke sini, atau klik untuk memilih dari komputer / HP.
          </p>
          <span className="text-[11px] text-cyan-400 font-semibold mt-3 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Mendukung: PDF, XLSX, XLS, CSV (Maks. 25MB)
          </span>
        </div>
      </div>

      {/* Ekspor Data Farm ke CSV (Excel) Section */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0d1f35] to-[#0c182b] border border-slate-700/80 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-game tracking-wider uppercase flex items-center gap-2">
                <span>EKSPOR DATA FARM KE CSV</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-sans font-semibold">
                  Excel Compatible
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Unduh file spreadsheet berisi data seluruh world dan riwayat transaksi farming Anda untuk cadangan atau analisis eksternal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                exportWorldsToCsv(worlds, accounts);
                setExportNotification(`Berhasil mengekspor ${worlds.length} world ke file CSV!`);
                setTimeout(() => setExportNotification(null), 4000);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Unduh seluruh daftar world dan status panen ke CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Ekspor Daftar World ({worlds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportSalesRecordsToCsv(salesRecords);
                setExportNotification(`Berhasil mengekspor ${salesRecords.length} catatan penjualan ke file CSV!`);
                setTimeout(() => setExportNotification(null), 4000);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Unduh seluruh riwayat penjualan Gems/Bibit/Item ke CSV"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Ekspor Penjualan ({salesRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {exportNotification && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{exportNotification}</span>
            </div>
            <button
              onClick={() => setExportNotification(null)}
              className="p-1 text-emerald-400/80 hover:text-emerald-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama berkas atau tag..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#142038] border border-slate-700/80 text-slate-100 text-xs placeholder:text-slate-500 focus:border-cyan-500"
            />
          </div>

          {/* Tag Chips as requested */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTag === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Tag
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Files List / Table */}
      {filteredFiles.length === 0 ? (
        <EmptyState
          title="Tidak Ada Berkas"
          description={
            searchQuery || selectedTag !== 'all'
              ? 'Tidak ada file yang cocok dengan pencarian atau tag yang dipilih.'
              : 'Belum ada berkas farming yang diunggah. Unggah file PDF atau Excel Anda sekarang!'
          }
          actionText={
            searchQuery || selectedTag !== 'all' ? 'Reset Pencarian' : 'Upload Berkas'
          }
          onAction={() => {
            if (searchQuery || selectedTag !== 'all') {
              setSearchQuery('');
              setSelectedTag('all');
            } else {
              onOpenUploadModal();
            }
          }}
        />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-800/80">
            {filteredFiles.map((file) => {
              const isPdf = file.type === 'pdf';
              const isExcel = file.type === 'xlsx' || file.type === 'xls' || file.type === 'csv';

              return (
                <div
                  key={file.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* File Icon Badge */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                        isPdf
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isPdf ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                          {file.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isPdf
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {file.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                        <span className="font-mono">{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>Diunggah {formatDateTime(file.uploadDate)}</span>
                      </div>

                      {/* Tag list */}
                      {file.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {file.tags.map((tag) => (
                            <span
                              key={tag}
                              onClick={() => setSelectedTag(tag)}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[#142038] text-slate-300 border border-slate-700 hover:border-amber-400 cursor-pointer transition-colors"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {file.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">{file.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Unduh dan Hapus */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleDownload(file)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Unduh Berkas"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Unduh</span>
                    </button>

                    <button
                      onClick={() => setFileToDelete(file)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                      title="Hapus Berkas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal for File Deletion */}
      <ConfirmDeleteModal
        isOpen={Boolean(fileToDelete)}
        title="Hapus Berkas Dokumen"
        itemName={fileToDelete?.name || ''}
        itemTypeLabel="Berkas"
        description="Berkas ini akan dihapus dari penyimpanan dokumen farm Anda."
        onConfirm={() => {
          if (fileToDelete) {
            onDeleteFile(fileToDelete.id);
            setFileToDelete(null);
          }
        }}
        onClose={() => setFileToDelete(null)}
      />
    </div>
  );
};
