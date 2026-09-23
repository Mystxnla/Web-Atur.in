import { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { uploadReference } from '../../services/api/index.js';
import { toast } from 'sonner';
import { cn } from '../../lib/cn.js';

const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_MB = 10;

export default function Dropzone({ onChange }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (f) => {
    if (!ACCEPTED.includes(f.type)) {
      toast.error('Format tidak didukung. Gunakan PDF, PNG, atau JPG.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`Ukuran file melebihi ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
    setUploading(true);
    try {
      const result = await uploadReference(f);
      onChange?.(result.url);
      toast.success('File berhasil diunggah.');
    } catch {
      toast.error('Gagal mengunggah file.');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        Upload Referensi Struktur / Dokumen <span className="text-gray-400 font-normal">(Opsional)</span>
      </label>

      {file ? (
        <div className="flex items-center gap-3 bg-primary-50 rounded-xl border border-primary-200 p-3">
          <FileText size={20} className="text-primary-600" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          {uploading ? (
            <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" aria-label="Mengunggah" />
          ) : (
            <button
              type="button"
              onClick={() => { setFile(null); onChange?.(null); }}
              className="p-1 text-gray-400 hover:text-danger-600 rounded"
              aria-label="Hapus file"
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
            dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
          )}
          aria-label="Upload dokumen referensi"
        >
          <Upload size={24} className="text-primary-400 mx-auto mb-2" aria-hidden />
          <p className="text-sm text-gray-600 font-medium">Klik untuk upload dokumen skema / foto sketsa</p>
          <p className="text-xs text-gray-400 mt-1">Format file: .pdf, .png, .jpg (Maksimal {MAX_MB}MB)</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}
    </div>
  );
}
