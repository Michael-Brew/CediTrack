import { apiRequest } from './client';

export interface CSVPreviewRow {
  row_index: number;
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  account_id: string | null;
  account_name: string | null;
  raw_source: string | null;
  is_valid: boolean;
  validation_error: string | null;
  confidence_category: number;
  confidence_account: number;
}

export interface CSVPreviewResponse {
  filename: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  detected_format: string;
  rows: CSVPreviewRow[];
  available_accounts: { id: string; name: string; type: string }[];
  available_categories: string[];
}

export interface CSVCommitRow {
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  account_id: string;
  reference_id?: string;
}

export interface CSVCommitRequest {
  filename: string;
  transactions: CSVCommitRow[];
}

export interface CSVCommitResponse {
  success: boolean;
  imported_count: number;
  flagged_anomalies_count: number;
  message: string;
}

export const uploadApi = {
  preview: (file: File, defaultAccountId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (defaultAccountId) {
      formData.append('default_account_id', defaultAccountId);
    }
    return apiRequest<CSVPreviewResponse>('/api/upload/preview', {
      method: 'POST',
      body: formData,
    });
  },
  commit: (data: CSVCommitRequest) => apiRequest<CSVCommitResponse>('/api/upload/commit', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getTemplateUrl: (templateType: 'momo' | 'bank' | 'sme') => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}/api/upload/templates/${templateType}`;
  }
};
