/**
 * Admin Page
 * Document management with file upload, list, and delete functionality.
 * Protected by HTTP Basic Auth with static admin credentials.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import UsageStats from '../components/UsageStats';
import { adminGetOrgCredits, adminAllocateCredits, type OrgCreditInfo } from '../api/client';

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
  
  // Org state
  const [newOrgName, setNewOrgName] = useState('');
  const [headName, setHeadName] = useState('');
  const [headEmail, setHeadEmail] = useState('');
  const [headPassword, setHeadPassword] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgMessage, setOrgMessage] = useState('');

  // Credits state
  const [orgCredits, setOrgCredits] = useState<OrgCreditInfo[]>([]);
  const [allocOrgId, setAllocOrgId] = useState('');
  const [allocAmount, setAllocAmount] = useState('');
  const [allocDays, setAllocDays] = useState('30');
  const [allocating, setAllocating] = useState(false);
  const [allocMsg, setAllocMsg] = useState('');

  // Get auth header
  const getAuthHeader = useCallback(() => {
    return 'Basic ' + btoa(`${username}:${password}`);
  }, [username, password]);

  // Load stats
  const loadStats = useCallback(async (page = currentPage, search = searchTerm) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (search) {
        queryParams.append('search_query', search);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/stats?${queryParams.toString()}`, {
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
  }, [isAuthenticated, getAuthHeader, currentPage, pageSize, searchTerm]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (stats && newPage > stats.total_pages)) return;
    setCurrentPage(newPage);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Create a specific load for search to avoid stale closure issues
      // Reset to page 1 on search change
      if (isAuthenticated) {
        // We only want to reload if the search term actually changed or we are initial loading
        // effectively handled by the dependency array
         loadStats(1, searchTerm);
         setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, isAuthenticated]); // Removed loadStats from dependency to avoid loop, though useCallback handles it.

  // Initial load is handled by the search effect now (as searchTerm is initial '')
  // or we can keep a separate effect for mount. 
  // actually, the debounce effect will run on mount too.

  // Tabs state
  const [activeTab, setActiveTab] = useState<'documents' | 'organizations' | 'usage' | 'credits'>('documents');

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      // Initial stats load to verify credentials
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
        loadStats(currentPage, searchTerm);
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
        loadStats(currentPage, searchTerm);
      } else {
        const data = await response.json();
        setUploadMessage(`❌ ${data.detail || 'Delete failed'}`);
      }
    } catch (err) {
      setUploadMessage('❌ Delete failed. Please try again.');
    }
  };

  // Create Organization
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !headEmail.trim() || !headPassword.trim()) return;
    
    setCreatingOrg(true);
    setOrgMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/organizations`, {
        method: 'POST',
        headers: { 
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          name: newOrgName,
          head_name: headName,
          head_email: headEmail,
          head_password: headPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOrgMessage(`✅ Created organization: ${data.organization.name} with Head: ${data.head_user.email}`);
        setNewOrgName('');
        setHeadName('');
        setHeadEmail('');
        setHeadPassword('');
      } else {
        setOrgMessage(`❌ ${data.detail || 'Creation failed'}`);
      }
    } catch (err) {
      setOrgMessage('❌ Creation failed. Please try again.');
    } finally {
      setCreatingOrg(false);
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
  
  // Use server-side results directly
  const displayDocs = stats?.documents || [];

  // Load org credits
  const loadOrgCredits = async () => {
    try {
      const data = await adminGetOrgCredits(username, password);
      setOrgCredits(data);
    } catch (err) {
      console.error('Failed to load org credits:', err);
    }
  };

  // Allocate credits
  const handleAllocateCredits = async () => {
    if (!allocOrgId || !allocAmount) return;
    setAllocating(true);
    setAllocMsg('');
    try {
      const result = await adminAllocateCredits(
        username,
        password,
        parseInt(allocOrgId),
        parseInt(allocAmount),
        parseInt(allocDays) || 30
      );
      setAllocMsg(`✅ Allocated ${result.credits_granted.toLocaleString()} credits to ${result.organization_name}`);
      setAllocAmount('');
      loadOrgCredits();
    } catch (err: any) {
      setAllocMsg(`❌ ${err.message || 'Allocation failed'}`);
    } finally {
      setAllocating(false);
    }
  };

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
          
          <nav className="admin-nav" style={{ display: 'flex', gap: '20px', marginLeft: '30px' }}>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`nav-tab ${activeTab === 'documents' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'documents' ? '2px solid var(--color-primary)' : '2px solid transparent',
                padding: '8px 4px',
                color: activeTab === 'documents' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              Documents
            </button>
            <button 
              onClick={() => setActiveTab('organizations')}
              className={`nav-tab ${activeTab === 'organizations' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'organizations' ? '2px solid var(--color-primary)' : '2px solid transparent',
                padding: '8px 4px',
                color: activeTab === 'organizations' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              Organizations
            </button>
            <button 
              onClick={() => setActiveTab('usage')}
              className={`nav-tab ${activeTab === 'usage' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'usage' ? '2px solid var(--color-primary)' : '2px solid transparent',
                padding: '8px 4px',
                color: activeTab === 'usage' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              AI Usage
            </button>
            <button 
              onClick={() => { setActiveTab('credits'); loadOrgCredits(); }}
              className={`nav-tab ${activeTab === 'credits' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'credits' ? '2px solid var(--color-primary)' : '2px solid transparent',
                padding: '8px 4px',
                color: activeTab === 'credits' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              ⚡ Credits
            </button>
          </nav>
        </div>
        
        <button onClick={() => setIsAuthenticated(false)} className="btn-logout" style={{ background: 'transparent', border: '1px solid currentColor', borderRadius: '6px', padding: '6px 12px' }}>
          Logout
        </button>
      </header>

      <main className="admin-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        
        {activeTab === 'documents' && (
          <>
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
                <h2>📚 Indexed Documents ({stats?.total_documents || 0})</h2>
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
              ) : displayDocs.length === 0 ? (
                <div className="empty-state">
                  {searchTerm ? 'No documents match your search.' : 'No documents indexed yet.'}
                </div>
              ) : (
                <div className="documents-list">
                  {displayDocs.map((doc) => (
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
          </>
        )}

        {activeTab === 'organizations' && (
          <section className="org-section" style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <div className="auth-card" style={{ maxWidth: '600px', width: '100%', padding: '40px' }}>
              <div className="auth-header" style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>🏢 Create Organization</h2>
                <p>Register a new law firm and assign its Head.</p>
              </div>

              <form onSubmit={handleCreateOrg} className="auth-form">
                <div className="form-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Legal Corp LLC"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    required
                  />
                </div>
                
                <div style={{ margin: '15px 0', borderTop: '1px solid var(--color-border)' }}></div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '10px' }}>👤 Assign Head User</h3>
                
                <div className="form-group">
                  <label>Head Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={headName}
                    onChange={(e) => setHeadName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Head Email</label>
                  <input
                    type="email"
                    placeholder="head@example.com"
                    value={headEmail}
                    onChange={(e) => setHeadEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Head Password</label>
                  <input
                    type="password"
                    placeholder="Secure password"
                    value={headPassword}
                    onChange={(e) => setHeadPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <button 
                  type="submit"
                  className="btn-primary"
                  disabled={creatingOrg || !newOrgName.trim() || !headEmail.trim() || !headPassword.trim()}
                  style={{ marginTop: '20px', width: '100%' }}
                >
                  {creatingOrg ? 'Creating Organization...' : 'Create Organization & Head'}
                </button>
              </form>

              {orgMessage && (
                <div className={`upload-message ${orgMessage.startsWith('✅') ? 'success' : 'error'}`} style={{ marginTop: '20px' }}>
                  {orgMessage}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'usage' && (
            <section className="usage-section" style={{ paddingTop: '20px' }}>
                <UsageStats authHeader={getAuthHeader()} />
            </section>
        )}

        {activeTab === 'credits' && (
          <section style={{ paddingTop: '20px' }}>
            {/* Allocate Form */}
            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--color-border)', marginBottom: '20px', maxWidth: '500px' }}>
              <h3 style={{ marginBottom: '16px' }}>⚡ Allocate Credits</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Organization ID</label>
                  <input
                    type="number"
                    value={allocOrgId}
                    onChange={e => setAllocOrgId(e.target.value)}
                    placeholder="1"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Credits Amount</label>
                  <input
                    type="number"
                    value={allocAmount}
                    onChange={e => setAllocAmount(e.target.value)}
                    placeholder="10000"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Period (days)</label>
                  <input
                    type="number"
                    value={allocDays}
                    onChange={e => setAllocDays(e.target.value)}
                    placeholder="30"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                </div>
                <button
                  onClick={handleAllocateCredits}
                  disabled={allocating || !allocOrgId || !allocAmount}
                  style={{ padding: '10px', borderRadius: '6px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: allocating ? 0.6 : 1 }}
                >
                  {allocating ? 'Allocating...' : 'Allocate Credits'}
                </button>
                {allocMsg && <p style={{ fontSize: '13px' }}>{allocMsg}</p>}
              </div>
            </div>

            {/* Org Credits Table */}
            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '16px' }}>🏢 Organization Credits</h3>
              {orgCredits.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)' }}>No organizations found.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Remaining</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Granted</th>
                      <th style={{ textAlign: 'center', padding: '8px' }}>Active</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgCredits.map(org => (
                      <tr key={org.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px' }}>{org.id}</td>
                        <td style={{ padding: '8px', fontWeight: 500 }}>{org.name}</td>
                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: 600, color: org.credits_remaining > 0 ? '#22c55e' : '#ef4444' }}>
                          {org.credits_remaining.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{org.credits_granted.toLocaleString()}</td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>{org.is_active ? '✅' : '❌'}</td>
                        <td style={{ textAlign: 'right', padding: '8px', fontSize: '12px' }}>
                          {org.period_end ? new Date(org.period_end).toLocaleDateString('ru-RU') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
