import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, ArrowRight } from 'lucide-react';
import { Account } from '../../api/accounts';

interface FileDropzoneProps {
  onFileSelected: (file: File, defaultAccountId?: string) => void;
  accounts: Account[];
  loading: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelected,
  accounts,
  loading,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcess(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcess(file);
    }
  };

  const validateAndProcess = (file: File) => {
    const validExts = ['.csv', '.xlsx', '.xls'];
    const nameLower = file.name.toLowerCase();
    const isValid = validExts.some(ext => nameLower.endsWith(ext));

    if (!isValid) {
      alert('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }
    onFileSelected(file, selectedAccount || undefined);
  };

  return (
    <div className="space-y-4">
      {/* Account Fallback Selector */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Fallback Default Account
          </label>
          <p className="text-xs text-slate-400">
            If rows in the file do not match an account name or description, assign to:
          </p>
        </div>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-850 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition-colors min-w-[200px]"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.type})
            </option>
          ))}
        </select>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden group ${
          dragOver
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-white mb-1 tracking-tight">
          {loading ? 'Analyzing statement layout...' : 'Drag and drop your statement file here'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mb-4">
          Supports MTN MoMo, Telecel Cash CSVs, and GCB/Ecobank/Stanbic bank statements (.csv, .xlsx, .xls) up to 10MB.
        </p>

        <button
          type="button"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 shadow-sm transition-all"
        >
          {loading ? 'Parsing...' : 'Browse Files on Device'}
        </button>
      </div>
    </div>
  );
};
