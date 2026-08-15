import { apiRequest } from './client';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'mobile_money' | 'bank' | 'cash' | 'other';
  initial_balance: number;
  currency: string;
  color: string;
  current_balance: number;
  total_income: number;
  total_expense: number;
  transaction_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountPayload {
  name: string;
  type: 'mobile_money' | 'bank' | 'cash' | 'other';
  initial_balance: number;
  currency?: string;
  color?: string;
}

export interface TransferPayload {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  date: string;
  description?: string;
}

export const accountsApi = {
  list: () => apiRequest<Account[]>('/api/accounts'),
  get: (id: string) => apiRequest<Account>(`/api/accounts/${id}`),
  create: (data: CreateAccountPayload) => apiRequest<Account>('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<CreateAccountPayload>) => apiRequest<Account>(`/api/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<void>(`/api/accounts/${id}`, {
    method: 'DELETE',
  }),
  transfer: (data: TransferPayload) => apiRequest<{ success: boolean; message: string }>('/api/accounts/transfer', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
