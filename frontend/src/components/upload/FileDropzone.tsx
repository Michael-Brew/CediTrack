import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
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
  
  // Find "Other" account ID as default, or fallback to first account
  const getInitialAccountId = () => {
    const otherAcc = accounts.find(
      (a) => a.name.trim().toLowerCase() === 'other' || a.type === 'other'
    );
    return otherAcc ? otherAcc.id : accounts[0]?.id || '';
  };

  const [selectedAccount, setSelectedAccount] = useState<string>(getInitialAccountId());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default selection if accounts load asynchronously
  useEffect(() => {
    if (accounts.length > 0) {
      const otherAcc = accounts.find(
        (a) => a.name.trim().toLowerCase() === 'other' || a.type === 'other'
      );
      if (otherAcc) {
        setSelectedAccount(otherAcc.id);
      } else if (!selectedAccount) {
        setSelectedAccount(accounts[0].id);
      }
    }
  }, [accounts]);

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
    const validExts = ['.pdf', '.csv', '.xlsx', '.xls'];
    const nameLower = file.name.toLowerCase();
    const isValid = validExts.some((ext) => nameLower.endsWith(ext));

    if (!isValid) {
      alert('Please select a valid statement file (.pdf, .csv, .xlsx, .xls)');
      return;
    }
    onFileSelected(file, selectedAccount || undefined);
  };

  return (
    <div className="space-y-4">
      {/* Account Fallback Selector */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Fallback Default Account
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            If transactions in your statement don't specify an account name, assign to:
          </p>
        </div>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-w-[200px]"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              {acc.name} {acc.type === 'other' ? '(Default Fallback)' : `(${acc.type})`}
            </option>
          ))}
          {/* If no Other account in list, provide default Other fallback option */}
          {!accounts.some((a) => a.name.trim().toLowerCase() === 'other') && (
            <option value="other" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              Other (General Account)
            </option>
          )}
        </select>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-sm ${
          dragOver
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10'
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/50 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.xlsx,.xls"
          onChange={handleChange}
          className="hidden"
        />

        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-sm">
          <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
          {loading ? 'Reading and parsing statement...' : 'Drag and drop your statement file here'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
          Supports <strong>PDF Statements</strong>, MoMo (MTN, Telecel, AT Money), and all Ghanaian bank statements (.pdf, .csv, .xlsx, .xls) up to 10MB.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{loading ? 'Processing...' : 'Browse PDF, CSV, or Excel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
