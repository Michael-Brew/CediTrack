import React from 'react';
import { Smartphone, Landmark, Store } from 'lucide-react';

export const TemplateDownloadBanner: React.FC = () => {
  const formats = [
    {
      id: 'momo',
      title: 'MoMo Statement',
      desc: 'MTN MoMo, Telecel Cash, and AT (AirtelTigo) Money exports in PDF, CSV, or Excel format.',
      icon: Smartphone,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
    },
    {
      id: 'bank',
      title: 'Bank Statement',
      desc: 'All Ghanaian banks (GCB, Ecobank, Stanbic, Absa, Fidelity, CalBank, Zenith, CBG, etc.) in PDF or spreadsheet format.',
      icon: Landmark,
      color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20',
    },
    {
      id: 'sme',
      title: 'SME Sales Ledger',
      desc: 'Daily business till logs, shop sales records, and bookkeeping sheets with details and categories.',
      icon: Store,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Supported Statement Formats & Sources
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload statements from any Ghanaian mobile money provider or commercial bank (.pdf, .csv, .xlsx, .xls) below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {formats.map((fmt) => {
          const Icon = fmt.icon;
          return (
            <div
              key={fmt.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 transition-all flex items-start gap-3 shadow-sm"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${fmt.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="font-semibold text-xs text-slate-900 dark:text-white truncate">{fmt.title}</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{fmt.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
