import React, { useState, useRef } from 'react';
import { FarmFile } from '../types';
import { X, UploadCloud, FileSpreadsheet, FileText, Tag, Plus, Check } from 'lucide-react';
import { formatFileSize } from '../utils/time';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (fileData: Omit<FarmFile, 'id' | 'uploadDate'>) => void;
}

const PRESET_TAGS = ['daftar harga', 'rencana farming', 'rotasi mingguan', 'kalkulasi profit', 'seed stock', 'catatan bfg'];

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [tags, setTags] = useState<string[]>(['daftar harga']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'xlsx', 'xls', 'csv'];
    if (!ext || !validExtensions.includes(ext)) {
      setError('Hanya mendukung berkas PDF dan Excel (.xlsx, .xls, .csv).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('Ukuran file maksimal 25 MB.');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Read as Data URL so user can actually download it later!
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileBase64(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

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
      handleFiles(e.dataTransfer.files);
    }
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTagInput.trim() && !tags.includes(customTagInput.trim().toLowerCase())) {
      setTags([...tags, customTagInput.trim().toLowerCase()]);
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Silakan pilih berkas PDF atau Excel terlebih dahulu.');
      return;
    }

    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'other';
    let fileType: FarmFile['type'] = 'other';
    if (ext === 'pdf') fileType = 'pdf';
    else if (ext === 'xlsx') fileType = 'xlsx';
    else if (ext === 'xls') fileType = 'xls';
    else if (ext === 'csv') fileType = 'csv';

    onUpload({
      name: selectedFile.name,
      type: fileType,
      size: selectedFile.size,
      tags: tags,
      dataUrl: fileBase64,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-[#0d1527] border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-[#111c33] border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5">
              <div className="w-full h-full bg-[#0a1122] rounded-[10px] flex items-center justify-center text-cyan-400">
                <UploadCloud className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-game tracking-wider">
                UPLOAD BERKAS FARMING
              </h2>
              <p className="text-xs text-slate-400">Simpan PDF strategi & Excel kalkulator harga</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-500/60 bg-emerald-500/5'
                : 'border-slate-700/80 bg-[#121c33]/40 hover:border-slate-600 hover:bg-[#121c33]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  {selectedFile.name.endsWith('.pdf') ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6" />
                  )}
                </div>
                <span className="text-sm font-bold text-slate-100 max-w-xs truncate">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-emerald-400 mt-1 font-medium">
                  {formatFileSize(selectedFile.size)} • Siap diupload
                </span>
                <span className="text-[11px] text-slate-500 mt-2 hover:underline">
                  Klik untuk ganti file
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="w-10 h-10 text-cyan-400/80 mb-2 animate-pulse" />
                <p className="text-sm font-semibold text-slate-200">
                  Tarik & Lepas file ke sini, atau <span className="text-cyan-400">Pilih Berkas</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Format didukung: PDF (.pdf) & Spreadsheet Excel (.xlsx, .xls, .csv)
                </p>
              </div>
            )}
          </div>

          {/* Tag Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Tag Kategori Berkas
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {PRESET_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="Tambah tag khusus..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#142038] border border-slate-700 text-slate-200"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tag</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Catatan Berkas (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Perhitungan profit season winter 2026"
              className="w-full px-4 py-2.5 rounded-xl bg-[#142038] border border-slate-700 focus:border-cyan-500 text-slate-100 text-sm font-medium transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-700/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Upload Berkas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
