/**
 * Admin Page
 * Document management with file upload, list, and delete functionality.
 * Protected by HTTP Basic Auth with static admin credentials.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.lawyerai.uz';

interface IndexedDocument {
  source_name: string;
  chunk_count: number;
  doc_type: string;
}

interface AdminStats {
  total_documents: number;
  total_chunks: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  documents: IndexedDocument[];
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  // Get auth header
  const getAuthHeader = useCallback(() => {
    return 'Basic ' + btoa(`${username}:${password}`);
  }, [username, password]);

  // Load stats
  const loadStats = useCallback(async (page = currentPage) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats?page=${page}&page_size=${pageSize}`, {
        headers: { 'Authorization': getAuthHeader() },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          setAuthError('Session expired. Please login again.');
          return;
        }
        throw new Error('Failed to load stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthHeader, currentPage, pageSize]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (stats && newPage > stats.total_pages)) return;
    setCurrentPage(newPage);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { 'Authorization': 'Basic ' + btoa(`${username}:${password}`) },
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        const data = await response.json();
        setStats(data);
      } else {
        setAuthError('Invalid admin credentials');
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    }
  };

  // Upload file
  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      setUploadMessage('❌ Only .docx files are supported');
      return;
    }
    
    setUploading(true);
    setUploadMessage('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader() },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUploadMessage(`✅ ${data.message}`);
        loadStats();
      } else {
        setUploadMessage(`❌ ${data.detail || 'Upload failed'}`);
      }
    } catch (err) {
      setUploadMessage('❌ Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const handleDelete = async (sourceName: string) => {
    if (!confirm(`Delete "${sourceName}" from the index?`)) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/documents/${encodeURIComponent(sourceName)}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': getAuthHeader() },
        }
      );
      
      if (response.ok) {
        setUploadMessage(`✅ Deleted: ${sourceName}`);
        loadStats();
      } else {
        const data = await response.json();
        setUploadMessage(`❌ ${data.detail || 'Delete failed'}`);
      }
    } catch (err) {
      setUploadMessage('❌ Delete failed. Please try again.');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Filter documents
  const filteredDocs = stats?.documents.filter(doc =>
    doc.source_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <Link to="/" className="back-link">← Back to Dashboard</Link>
          <h1>🔐 Admin Login</h1>
          <p className="login-subtitle">Document Management System</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {authError && <div className="auth-error">{authError}</div>}
            <button type="submit" className="btn-login">Login</button>
          </form>
        </div>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="header-left">
          <Link to="/" className="back-link">← Dashboard</Link>
          <h1>⚙️ Admin Panel</h1>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="btn-logout">
          Logout
        </button>
      </header>

      <main className="admin-content">
        {/* Stats Cards */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-value">{stats?.total_documents || 0}</div>
            <div className="stat-label">Documents</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{stats?.total_chunks || 0}</div>
            <div className="stat-label">Total Chunks</div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="upload-section">
          <h2>📤 Upload Document</h2>
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="upload-progress">
                <div className="spinner">⏳</div>
                <p>Processing document...</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">📁</div>
                <p>Drag & drop a .docx file here</p>
                <p className="upload-hint">or</p>
                <label className="btn-select-file">
                  Select File
                  <input
                    type="file"
                    accept=".docx"
                    onChange={handleFileSelect}
                    hidden
                  />
                </label>
                <p className="upload-formats">
                  Supports: Russian codes (Статья), Uzbek codes (X-modda), Decrees (QAROR/NIZOM)
                </p>
              </>
            )}
          </div>
          {uploadMessage && (
            <div className={`upload-message ${uploadMessage.startsWith('✅') ? 'success' : 'error'}`}>
              {uploadMessage}
            </div>
          )}
        </section>

        {/* Documents List */}
        <section className="documents-section">
          <div className="section-header">
            <h2>📚 Indexed Documents ({filteredDocs.length})</h2>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {loading ? (
            <div className="loading">Loading...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? 'No documents match your search.' : 'No documents indexed yet.'}
            </div>
          ) : (
            <div className="documents-list">
              {filteredDocs.map((doc) => (
                <div key={doc.source_name} className="document-item">
                  <div className="doc-info">
                    <span className="doc-icon">
                      {doc.doc_type === 'russian_code' ? '🇷🇺' : 
                       doc.doc_type === 'uzbek_code' ? '🇺🇿' : 
                       doc.doc_type === 'decree' ? '📜' : '📄'}
                    </span>
                    <div className="doc-details">
                      <span className="doc-name">{doc.source_name}</span>
                      <span className="doc-meta">
                        {doc.chunk_count} chunks • {doc.doc_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(doc.source_name)}
                    title="Delete document"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pagination Controls */}
        {stats && stats.total_pages > 1 && (
          <section className="pagination-controls">
            <button 
              className="btn-page" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {stats.total_pages}
            </span>
            <button 
              className="btn-page" 
              disabled={currentPage === stats.total_pages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
