import { API_BASE_URL, getToken } from './client';

export interface FeatureStats {
  feature: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
}

export interface UsageStatsSummary {
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  currency: string;
  by_feature: FeatureStats[];
}

export interface UsageRecord {
  id: number;
  user_id: number | null;
  model_name: string;
  request_type: string;
  feature: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  created_at: string;
}

function buildHeaders(authHeader?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  } else {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const statsApi = {
  getSummary: async (startDate?: Date, endDate?: Date, authHeader?: string): Promise<UsageStatsSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());

    const response = await fetch(`${API_BASE_URL}/api/stats/summary?${params.toString()}`, {
      headers: buildHeaders(authHeader)
    });

    if (!response.ok) throw new Error('Failed to fetch usage summary');
    return response.json();
  },

  getHistory: async (skip: number = 0, limit: number = 100, userId?: number, authHeader?: string, feature?: string): Promise<UsageRecord[]> => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (userId) params.append('user_id', userId.toString());
    if (feature) params.append('feature', feature);

    const response = await fetch(`${API_BASE_URL}/api/stats/history?${params.toString()}`, {
      headers: buildHeaders(authHeader)
    });

    if (!response.ok) throw new Error('Failed to fetch usage history');
    return response.json();
  }
};
