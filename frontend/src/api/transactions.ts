import { apiRequest } from './client';

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  account_name?: string;
  account_type?: string;
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  is_flagged_anomaly: boolean;
  anomaly_reason?: string | null;
  source: string;
  reference_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  search?: string;
  account_id?: string;
  type?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  is_flagged_anomaly?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateTransactionPayload {
  account_id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  is_flagged_anomaly?: boolean;
  anomaly_reason?: string;
  source?: string;
  reference_id?: string;
}

export interface CategorizePreviewResponse {
  category: string;
  suggested_account_name: string | null;
  confidence: number;
}

export const transactionsApi = {
  list: (filters: TransactionFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.account_id) params.append('account_id', filters.account_id);
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.is_flagged_anomaly !== undefined) params.append('is_flagged_anomaly', String(filters.is_flagged_anomaly));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const qs = params.toString();
    return apiRequest<Transaction[]>(`/api/transactions${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => apiRequest<Transaction>(`/api/transactions/${id}`),
  create: (data: CreateTransactionPayload) => apiRequest<Transaction>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<CreateTransactionPayload>) => apiRequest<Transaction>(`/api/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<void>(`/api/transactions/${id}`, {
    method: 'DELETE',
  }),
  categorizePreview: (description: string, type: string = 'Expense') => apiRequest<CategorizePreviewResponse>('/api/transactions/categorize', {
    method: 'POST',
    body: JSON.stringify({ description, type }),
  }),
  dismissAnomaly: (id: string) => apiRequest<{ success: boolean; message: string }>(`/api/transactions/${id}/dismiss-anomaly`, {
    method: 'POST',
  }),
};
