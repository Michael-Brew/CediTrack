import React from 'react';
import { Smartphone, Landmark, Banknote, HelpCircle, ArrowRightLeft, Edit, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Account } from '../../api/accounts';
import { formatGHS, getAccountTypeLabel } from '../../lib/formatters';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onTransfer: (account: Account) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  onTransfer,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mobile_money':
        return Smartphone;
      case 'bank':
        return Landmark;
      case 'cash':
        return Banknote;
      default:
        return HelpCircle;
    }
  };

  const Icon = getTypeIcon(account.type);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between group">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner"
              style={{ backgroundColor: account.color || '#10B981' }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white tracking-tight leading-tight">{account.name}</h4>
              <span className="text-[11px] font-medium text-slate-400">
                {getAccountTypeLabel(account.type)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onTransfer(account)}
              title="Transfer Funds"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(account)}
              title="Edit Account"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(account.id)}
              title="Delete Account"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Balance</span>
          <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            {formatGHS(account.current_balance)}
          </div>
        </div>
      </div>

      {/* Inflow/Outflow Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block">Inflow</span>
            <span className="font-semibold">{formatGHS(account.total_income)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-rose-400">
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block">Outflow</span>
            <span className="font-semibold">{formatGHS(account.total_expense)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
