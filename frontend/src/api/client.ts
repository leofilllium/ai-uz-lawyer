/**
 * API Client
 * Handles all API calls to the FastAPI backend with JWT authentication and SSE support.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.lawyerai.uz';

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
  role?: 'HEAD' | 'SENIOR' | 'EMPLOYEE';
  is_approved?: boolean;
  organization_id?: number;
  created_at?: string;
}

export interface Organization {
  id: number;
  name: string;
  created_at: string;
}

export const TaskStatus = {
  BACKLOG: "BACKLOG",
  TO_DO: "TO_DO",
  IN_PROGRESS: "IN_PROGRESS",
  REVIEW: "REVIEW",
  DONE: "DONE",
  RE_DO: "RE_DO"
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT"
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export const TaskComplexity = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD"
} as const;

export type TaskComplexity = typeof TaskComplexity[keyof typeof TaskComplexity];

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  complexity: TaskComplexity;
  deadline?: string;
  organization_id: number;
  assignee_id?: number;
  reporter_id: number;
  reporter_name?: string;
  assignee_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  filename: string;
  file_path?: string;
  file_size: number;
  content_type?: string;
  uploaded_by: number;
  created_at: string;
}

export interface TaskDetail extends Task {
  comments: TaskComment[];
  attachments: TaskAttachment[];
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// ... (Chat types remain same)
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
  chapter?: string;
  title?: string;
  preview?: string;
  similarity?: string;
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
  updated_at?: string; // Corrected interface mismatch if any
}

// ... (History types)
export interface HistoryItem {
  id: number;
  type: 'chat' | 'validation' | 'generation' | 'document_validation';
  title: string;
  preview: string;
  created_at: string;
  updated_at: string;
  icon: string;
  metadata: any;
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

// Fetch with auth for FormData (file uploads — no Content-Type header)
async function fetchWithAuthFormData(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {};
  
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
export async function register(name: string, email: string, password: string, organizationId: number): Promise<AuthResponse> {
  const response = await fetchWithAuth('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, organization_id: organizationId }),
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

export async function adminCreateOrganization(name: string, username: string, password: string): Promise<Organization> {
  const authHeader = 'Basic ' + btoa(`${username}:${password}`);
  const response = await fetch(`${API_BASE_URL}/api/admin/organizations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify({ name })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create organization');
  }
  
  return response.json();
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

// Organization API
export async function getOrganizations(): Promise<Organization[]> {
  const response = await fetchWithAuth('/api/organization/');
  if (!response.ok) throw new Error('Failed to fetch organizations');
  return response.json();
}

export async function getOrgUsers(): Promise<User[]> {
  const response = await fetchWithAuth('/api/organization/my/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function approveUser(userId: number): Promise<void> {
  const response = await fetchWithAuth(`/api/organization/users/${userId}/approve`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to approve user');
}

export async function updateUserRole(userId: number, role: string): Promise<void> {
  const response = await fetchWithAuth(`/api/organization/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ user_id: userId, role })
  });
  if (!response.ok) throw new Error('Failed to update role');
}


// Tasks API
export async function getTasks(): Promise<Task[]> {
  const response = await fetchWithAuth('/api/tasks/');
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function getTask(taskId: number): Promise<TaskDetail> {
  const response = await fetchWithAuth(`/api/tasks/${taskId}`);
  if (!response.ok) throw new Error('Failed to fetch task');
  return response.json();
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const response = await fetchWithAuth('/api/tasks/', {
    method: 'POST',
    body: JSON.stringify(task)
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}

export async function updateTask(taskId: number, updates: Partial<Task>): Promise<Task> {
  const response = await fetchWithAuth(`/api/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

export async function deleteTask(taskId: number): Promise<void> {
  const response = await fetchWithAuth(`/api/tasks/${taskId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete task');
}

// Task Comments API
export async function getTaskComments(taskId: number): Promise<TaskComment[]> {
  const response = await fetchWithAuth(`/api/tasks/${taskId}/comments`);
  if (!response.ok) throw new Error('Failed to fetch comments');
  return response.json();
}

export async function addTaskComment(taskId: number, content: string): Promise<TaskComment> {
  const response = await fetchWithAuth(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return response.json();
}

export async function deleteTaskComment(taskId: number, commentId: number): Promise<void> {
  const response = await fetchWithAuth(`/api/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete comment');
}

// Task Attachments API
export async function getTaskAttachments(taskId: number): Promise<TaskAttachment[]> {
  const response = await fetchWithAuth(`/api/tasks/${taskId}/attachments`);
  if (!response.ok) throw new Error('Failed to fetch attachments');
  return response.json();
}

export async function uploadTaskAttachment(taskId: number, file: File): Promise<TaskAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetchWithAuthFormData(`/api/tasks/${taskId}/attachments`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) throw new Error('Failed to upload attachment');
  return response.json();
}

export async function deleteTaskAttachment(taskId: number, attachmentId: number): Promise<void> {
  const response = await fetchWithAuth(`/api/tasks/${taskId}/attachments/${attachmentId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete attachment');
}

export async function downloadTaskAttachment(taskId: number, attachmentId: number, filename: string): Promise<void> {
  const response = await fetchWithAuth(`/api/tasks/${taskId}/attachments/${attachmentId}/download`);
  if (!response.ok) throw new Error('Failed to download attachment');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// Lawyer Chat API
export async function getChatSessions(skip: number = 0, limit: number = 20): Promise<ChatSession[]> {
  const response = await fetchWithAuth(`/api/lawyer/sessions?skip=${skip}&limit=${limit}`);
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
  onDone?: (sessionId: number, sources: Source[]) => void,
  chatMode: 'risk-manager' | 'smalltalk' | 'consultant' | 'practitioner' | 'litigator' | 'legal-audit' | 'compliance' | 'tax' | 'corporate' | 'commercial' | 'negotiator' | 'startup' | 'procedural' | 'deadlines' | 'hr' | 'worker-protection' | 'analyst' | 'skeptic' | 'judge-questions' | 'odds' | 'strategist' | 'what-if' | 'interview-practice' | 'family' | 'real-estate' | 'notary' | 'ip' | 'criminal-defense' | 'criminal-prosecution' | 'admin-defense' | 'admin-procedure' | 'customs' | 'procurement' | 'enforcement' | 'arbitration' | 'constitutional' | 'consumer-protection' | 'housing' | 'land-disputes' | 'digital-law' | 'environmental' | 'antitrust' | 'insurance' | 'banking' | 'securities' | 'investor-protection' | 'mediation' | 'doc-review' | 'legal-letter' | 'compliance-hr' | 'debt-collection' | 'bankruptcy' | 'merger-acquisition' | 'licensing' | 'regulatory' | 'cross-border' | 'forensic-legal' | 'quick-answer' = 'risk-manager'
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
    body: JSON.stringify({ message, session_id: sessionId, chat_mode: chatMode }),
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
  
  // API returns { audit: {...}, sources: [...] } structure
  // Flatten it to match ContractAnalysis interface
  return {
    id: data.analysis_id || 0,
    contract_preview: contract.substring(0, 100) + '...',
    validity_score: data.audit?.validity_score || 0,
    score_explanation: data.audit?.score_explanation || '',
    critical_errors: data.audit?.critical_errors || [],
    warnings: data.audit?.warnings || [],
    missing_clauses: data.audit?.missing_clauses || [],
    summary: data.audit?.summary || '',
    sources: data.sources || [],
  };
}

export async function getValidationHistory(): Promise<ContractAnalysis[]> {
  const response = await fetchWithAuth('/api/validator/history');
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
}

export async function getValidationById(id: number): Promise<ContractAnalysis> {
  const response = await fetchWithAuth(`/api/validator/${id}`);
  if (!response.ok) throw new Error('Validation not found');
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

export async function getGeneratedContractById(id: number): Promise<GeneratedContract> {
  const response = await fetchWithAuth(`/api/generator/contract/${id}`);
  if (!response.ok) throw new Error('Contract not found');
  return response.json();
}

// Unified History API
export async function getHistory(type?: 'chat' | 'validation' | 'generation' | 'document_validation', skip: number = 0, limit: number = 50): Promise<HistoryItem[]> {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());
  
  const response = await fetchWithAuth(`/api/history?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
}

export async function deleteHistoryItem(type: 'chat' | 'validation' | 'generation' | 'document_validation', id: number): Promise<void> {
  const response = await fetchWithAuth(`/api/history/${type}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete item');
  }
}

// Contact API
export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function sendContactMessage(name: string, email: string, message: string, phone?: string): Promise<{status: string, message: string}> {
  const response = await fetchWithAuth('/api/contact/send', {
    method: 'POST',
    body: JSON.stringify({ name, email, message, phone }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send message');
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════
// Document Validator API (11-Block Comprehensive Analysis)
// ═══════════════════════════════════════════════════════════════

export interface DocumentValiditySection {
  is_valid?: boolean;
  is_current?: boolean;
  is_consistent?: boolean;
  is_compliant?: boolean;
  passes_ethics?: boolean;
  score: number;
  issues?: Array<Record<string, any>>;
  explanation: string;
  [key: string]: any;
}

export interface DocumentRiskSection {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  risks: Array<Record<string, any>>;
  mitigation_suggestions: string[];
  explanation: string;
}

export interface DocumentLitigationSection {
  readiness_level: 'low' | 'medium' | 'high';
  score: number;
  evidence_gaps: Array<Record<string, any>>;
  litigation_strategy: string[];
  explanation: string;
  [key: string]: any;
}

export interface DocumentAudit {
  overall_score: number;
  document_type_detected: string;
  formal_validity: DocumentValiditySection;
  legal_validity: DocumentValiditySection;
  up_to_dateness: DocumentValiditySection;
  compliance_check: DocumentValiditySection;
  risk_analysis: DocumentRiskSection;
  consistency_check: DocumentValiditySection;
  jurisdiction_intelligence: DocumentValiditySection;
  litigation_readiness: DocumentLitigationSection;
  ethical_guardrails: DocumentValiditySection;
  improvements: Array<{
    issue: string;
    location: string;
    current_text?: string;
    suggested_text: string;
    priority: string;
    explanation: string;
  }>;
  summary: string;
  explainability: string;
}

export interface DocumentAnalysis {
  id: number;
  document_preview: string;
  document_type?: string;
  overall_score: number;
  formal_validity: Record<string, any>;
  legal_validity: Record<string, any>;
  up_to_dateness: Record<string, any>;
  compliance_check: Record<string, any>;
  risk_analysis: Record<string, any>;
  consistency_check: Record<string, any>;
  jurisdiction_intelligence: Record<string, any>;
  litigation_readiness: Record<string, any>;
  ethical_guardrails: Record<string, any>;
  improvements: Array<Record<string, any>>;
  summary?: string;
  explainability?: string;
  sources: Source[];
  created_at?: string;
}

export async function analyzeDocument(document: string, documentType?: string): Promise<{
  analysis_id: number;
  session_id?: number;
  audit: DocumentAudit;
  sources: Source[];
}> {
  const response = await fetchWithAuth('/api/document-validator/analyze', {
    method: 'POST',
    body: JSON.stringify({ document, document_type: documentType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Document analysis failed');
  }

  return response.json();
}

export async function getDocumentValidationHistory(): Promise<DocumentAnalysis[]> {
  const response = await fetchWithAuth('/api/document-validator/history');
  if (!response.ok) throw new Error('Failed to fetch document validation history');
  return response.json();
}

export async function getDocumentValidationById(id: number): Promise<DocumentAnalysis> {
  const response = await fetchWithAuth(`/api/document-validator/${id}`);
  if (!response.ok) throw new Error('Document analysis not found');
  return response.json();
}


// Calendar Events API
export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_datetime: string;
  organization_id: number;
  created_by: number;
  created_at: string;
  creator_name?: string;
}

export async function getCalendarEvents(year?: number, month?: number): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  const qs = params.toString();
  const response = await fetchWithAuth(`/api/calendar/${qs ? '?' + qs : ''}`);
  if (!response.ok) throw new Error('Failed to load calendar events');
  return response.json();
}

export async function createCalendarEvent(data: { title: string; description?: string; event_datetime: string }): Promise<CalendarEvent> {
  const response = await fetchWithAuth('/api/calendar/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create event');
  return response.json();
}

export async function deleteCalendarEvent(eventId: number): Promise<void> {
  const response = await fetchWithAuth(`/api/calendar/${eventId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete event');
}
