export function formatGHS(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "₵0.00";
  }
  const num = Number(amount);
  const formatted = Math.abs(num).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${num < 0 ? '-' : ''}₵${formatted}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function getAccountTypeLabel(type: string): string {
  switch (type) {
    case 'mobile_money':
      return 'Mobile Money';
    case 'bank':
      return 'Bank Account';
    case 'cash':
      return 'Cash / Till';
    default:
      return 'Other Account';
  }
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Transport": "#F59E0B",
  "Food": "#EF4444",
  "MoMo/Airtime": "#8B5CF6",
  "Data Bundle": "#6366F1",
  "Rent": "#EC4899",
  "Bills": "#F97316",
  "Susu/Savings": "#059669",
  "Entertainment": "#A855F7",
  "Personal Care": "#D946EF",
  "Inventory/Supplies": "#EAB308",
  "Logistics/Delivery": "#3B82F6",
  "Marketing": "#06B6D4",
  "Salary": "#10B981",
  "Business Income": "#059669",
  "Gift/Remittance": "#14B8A6",
  "Susu Payout": "#0D9488",
  "Investment/Interest": "#0284C7",
  "Other Income": "#64748B",
  "Other Expense": "#94A3B8"
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || "#94A3B8";
}
