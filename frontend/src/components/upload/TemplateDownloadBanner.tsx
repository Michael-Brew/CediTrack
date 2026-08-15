import React from 'react';
import { Download, FileSpreadsheet, Smartphone, Landmark, Store } from 'lucide-react';
import { uploadApi } from '../../api/upload';

export const TemplateDownloadBanner: React.FC = () => {
  const templates = [
    {
      id: 'momo' as const,
      title: 'MTN MoMo Statement',
      desc: 'Standard mobile money export with description, amount, type, reference.',
      icon: Smartphone,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'bank' as const,
      title: 'Bank Statement (Debit/Credit)',
      desc: 'GCB, Ecobank, Stanbic style format with debit & credit split columns.',
      icon: Landmark,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      id: 'sme' as const,
      title: 'SME Sales & Expenses Ledger',
      desc: 'Daily business till format with details, type, account, and category.',
      icon: Store,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">Download Sample Statement Templates</h4>
          <p className="text-xs text-slate-400">
            Use these ready-to-test CSV files to try out statement parsing and automatic categorization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {templates.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <a
              key={tpl.id}
              href={uploadApi.getTemplateUrl(tpl.id)}
              download
              className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-3 group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${tpl.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-white truncate">{tpl.title}</h5>
                  <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{tpl.desc}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
