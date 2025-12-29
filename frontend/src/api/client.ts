/**
 * API Client
 * Handles all API calls to the FastAPI backend with JWT authentication and SSE support.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token storage
const TOKEN_KEY = 'ai_lawyer_token';
const USER_KEY = 'ai_lawyer_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }
  return null;
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ChatSession {
  id: number;
  user_id?: number;
  session_type: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  message_count: number;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  created_at?: string;
}

export interface Source {
  article: string;
  source: string;
  chapter: string;
  title: string;
  preview: string;
  similarity: string;
}

export interface ContractAnalysis {
  id: number;
  contract_preview: string;
  validity_score: number;
  score_explanation?: string;
  critical_errors: Array<{error: string; article: string; fix: string}>;
  warnings: Array<{risk: string; explanation: string; suggestion: string}>;
  missing_clauses: Array<{clause_name: string; article_reference: string; drafted_text: string}>;
  summary?: string;
  sources: Source[];
  created_at?: string;
}

export interface GeneratedContract {
  id: number;
  category: string;
  requirements: string;
  generated_text: string;
  template_names: string[];
  sources: Source[];
  created_at?: string;
}

export interface HistoryItem {
  id: number;
  type: 'chat' | 'validation' | 'generation';
  title: string;
  preview: string;
  created_at?: string;
  updated_at?: string;
  icon: string;
  metadata: Record<string, any>;
}

// Base fetch with auth
async function fetchWithAuth(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  return response;
}

// Auth API
export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetchWithAuth('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.error || 'Registration failed');
  }
  
  const data = await response.json();
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetchWithAuth('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.error || 'Login failed');
  }
  
  const data = await response.json();
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function getMe(): Promise<User> {
  const response = await fetchWithAuth('/api/auth/me');
  
  if (!response.ok) {
    throw new Error('Not authenticated');
  }
  
  return response.json();
}

export function logout(): void {
  removeToken();
}

// Lawyer Chat API
export async function getChatSessions(): Promise<ChatSession[]> {
  const response = await fetchWithAuth('/api/lawyer/sessions');
  if (!response.ok) throw new Error('Failed to fetch sessions');
  return response.json();
}

export async function getChatSession(sessionId: number): Promise<{messages: ChatMessage[]}> {
  const response = await fetchWithAuth(`/api/lawyer/sessions/${sessionId}`);
  if (!response.ok) throw new Error('Failed to fetch session');
  return response.json();
}

export async function sendChatMessage(
  message: string, 
  sessionId?: number,
  onChunk?: (chunk: string) => void,
  onDone?: (sessionId: number, sources: Source[]) => void
): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}/api/lawyer/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Chat failed');
  }
  
  // Parse SSE stream
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.chunk && onChunk) {
            onChunk(data.chunk);
          }
          if (data.done && onDone) {
            onDone(data.session_id, data.sources || []);
          }
          if (data.error) {
            throw new Error(data.error);
          }
        } catch (e) {
          // Ignore parse errors for incomplete JSON
        }
      }
    }
  }
}

// Validator API
export async function analyzeContract(contract: string): Promise<ContractAnalysis> {
  const response = await fetchWithAuth('/api/validator/analyze', {
    method: 'POST',
    body: JSON.stringify({ contract }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }
  
  const data = await response.json();
  return data;
}

export async function getValidationHistory(): Promise<ContractAnalysis[]> {
  const response = await fetchWithAuth('/api/validator/history');
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
}

// Generator API
export interface ContractCategory {
  name: string;
  count: number;
  description: string;
}

export async function getCategories(): Promise<ContractCategory[]> {
  const response = await fetchWithAuth('/api/generator/categories');
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function generateContract(
  category: string,
  requirements: string,
  onChunk?: (chunk: string) => void,
  onDone?: (contractId: number, sources: Source[]) => void
): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}/api/generator/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ category, requirements }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Generation failed');
  }
  
  // Parse SSE stream
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.chunk && onChunk) {
            onChunk(data.chunk);
          }
          if (data.done && onDone) {
            onDone(data.contract_id, data.sources || []);
          }
          if (data.error) {
            throw new Error(data.error);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}

export async function getGenerationHistory(): Promise<GeneratedContract[]> {
  const response = await fetchWithAuth('/api/generator/history');
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
}

// Unified History API
export async function getHistory(type?: 'chat' | 'validation' | 'generation'): Promise<HistoryItem[]> {
  const params = type ? `?type=${type}` : '';
  const response = await fetchWithAuth(`/api/history${params}`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
}
