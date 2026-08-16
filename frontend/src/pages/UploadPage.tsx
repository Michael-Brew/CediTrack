import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { CSVPreviewResponse, CSVCommitRow, uploadApi } from '../api/upload';
import { Account, accountsApi } from '../api/accounts';
import { TemplateDownloadBanner } from '../components/upload/TemplateDownloadBanner';
import { FileDropzone } from '../components/upload/FileDropzone';
import { StatementReviewGrid } from '../components/upload/StatementReviewGrid';

interface UploadPageProps {
  onNavigateTab: (tab: any) => void;
  onRefreshParent?: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onNavigateTab, onRefreshParent }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [preview, setPreview] = useState<CSVPreviewResponse | null>(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ imported: number; flagged: number } | null>(null);

  useEffect(() => {
    accountsApi.list().then(setAccounts).catch(console.error);
  }, []);

  const handleFileSelected = async (file: File, defaultAccountId?: string) => {
    try {
      setParsing(true);
      setSuccessInfo(null);
      const res = await uploadApi.preview(file, defaultAccountId);
      setPreview(res);
    } catch (err: any) {
      alert(err.message || 'Failed to process statement file.');
    } finally {
      setParsing(false);
    }
  };

  const handleCommit = async (filename: string, rows: CSVCommitRow[]) => {
    try {
      setCommitting(true);
      const res = await uploadApi.commit({
        filename,
        transactions: rows,
      });
      setSuccessInfo({
        imported: res.imported_count,
        flagged: res.flagged_anomalies_count,
      });
      setPreview(null);
      onRefreshParent?.();
    } catch (err: any) {
      alert(err.message || 'Failed to commit transactions to ledger');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 lg:pb-12">
      {/* Success State */}
      {successInfo && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-emerald-950/60 dark:via-slate-900 dark:to-slate-900 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-4 animate-fade-in shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Statement Imported Successfully!</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              <strong>{successInfo.imported}</strong> transactions were recorded into your ledger.
              {successInfo.flagged > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold block mt-1">
                  ⚠️ {successInfo.flagged} high-expense transactions were flagged for your 30-day review.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center gap-2"
            >
              <span>View Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-900 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Open Ledger
            </button>
            <button
              onClick={() => setSuccessInfo(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium"
            >
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Dropzone & Templates */}
      {!preview && !successInfo && (
        <>
          <TemplateDownloadBanner />
          <FileDropzone
            onFileSelected={handleFileSelected}
            accounts={accounts}
            loading={parsing}
          />
        </>
      )}

      {/* Step 2: Interactive Review Grid */}
      {preview && (
        <StatementReviewGrid
          preview={preview}
          accounts={accounts}
          onCommit={handleCommit}
          onCancel={() => setPreview(null)}
          loading={committing}
        />
      )}
    </div>
  );
};
