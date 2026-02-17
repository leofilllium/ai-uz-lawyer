import { useState, useEffect, useCallback } from 'react';
import { statsApi, type UsageStatsSummary, type UsageRecord } from '../api/stats';
import { FileText, BarChart2, Coins, Zap } from 'lucide-react';

interface UsageStatsProps {
  authHeader?: string;
}

export default function UsageStats({ authHeader }: UsageStatsProps) {
  const [summary, setSummary] = useState<UsageStatsSummary | null>(null);
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Load Summary
      const summaryData = await statsApi.getSummary(undefined, undefined, authHeader);
      setSummary(summaryData);

      // Load History
      const historyData = await statsApi.getHistory((page - 1) * pageSize, pageSize, undefined, authHeader);
      setHistory(historyData);
    } catch (err) {
        console.error(err);
      setError('Failed to load usage statistics');
    } finally {
      setLoading(false);
    }
  }, [authHeader, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !summary && !history.length) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
            <div className="spinner" style={{ fontSize: '2rem' }}></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="error-message" style={{ margin: 'var(--space-lg)' }}>
            {error}
        </div>
    );
  }

  return (
    <div className="usage-stats-container">
      {/* Header & Tabs */}
      <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 'var(--space-xl)',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
      }}>
        <div>
            <h2 style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '24px', 
                fontWeight: 700, 
                color: 'var(--color-text-primary)' 
            }}>
                AI Usage Analytics
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                Track token consumption and costs
            </p>
        </div>
        
        <div style={{ 
            display: 'flex', 
            gap: 'var(--space-xs)', 
            background: 'var(--color-surface)', 
            padding: '4px', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)'
        }}>
            <button 
                onClick={() => setActiveTab('summary')}
                style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: activeTab === 'summary' ? 'var(--color-background)' : 'transparent',
                    color: activeTab === 'summary' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'summary' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.2s ease'
                }}
            >
                Overview
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: activeTab === 'history' ? 'var(--color-background)' : 'transparent',
                    color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'history' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.2s ease'
                }}
            >
                History Logs
            </button>
        </div>
      </div>

      {activeTab === 'summary' && summary && (
        <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {/* Total Requests */}
          <div className="bento-card" style={{ gridColumn: 'span 1' }}>
            <div className="bento-card__inner">
                <div className="bento-card__header">
                    <div className="bento-card__icon" style={{ '--card-accent': 'var(--color-info)' } as any}>
                        <BarChart2 size={24} />
                    </div>
                </div>
                <div className="bento-card__title">Total Requests</div>
                <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-display)' }}>
                    {summary.total_requests}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                    All time processed requests
                </div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="bento-card" style={{ gridColumn: 'span 1' }}>
            <div className="bento-card__inner" style={{ borderColor: 'var(--color-gold-glow)' }}>
                <div className="bento-card__header">
                    <div className="bento-card__icon" style={{ '--card-accent': 'var(--color-gold)' } as any}>
                        <Coins size={24} />
                    </div>
                </div>
                <div className="bento-card__title">Total Cost</div>
                <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}>
                    ${summary.total_cost.toFixed(4)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                    Estimated API costs
                </div>
            </div>
          </div>

          {/* Input Tokens */}
          <div className="bento-card" style={{ gridColumn: 'span 1' }}>
            <div className="bento-card__inner">
                <div className="bento-card__header">
                    <div className="bento-card__icon" style={{ '--card-accent': 'var(--color-primary)' } as any}>
                        <FileText size={24} />
                    </div>
                </div>
                <div className="bento-card__title">Input Tokens</div>
                <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-display)' }}>
                    {(summary.total_input_tokens / 1000).toFixed(1)}k
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                    Prompt consumption
                </div>
            </div>
          </div>

          {/* Output Tokens */}
          <div className="bento-card" style={{ gridColumn: 'span 1' }}>
            <div className="bento-card__inner">
                <div className="bento-card__header">
                    <div className="bento-card__icon" style={{ '--card-accent': 'var(--color-success)' } as any}>
                        <Zap size={24} />
                    </div>
                </div>
                <div className="bento-card__title">Output Tokens</div>
                <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-display)' }}>
                    {(summary.total_output_tokens / 1000).toFixed(1)}k
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                    Generation volume
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ 
            background: 'var(--color-background)', 
            border: '1px solid var(--color-border)', 
            borderRadius: 'var(--radius-xl)', 
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-surface)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</th>
                            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type / Model</th>
                            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tokens (In / Out)</th>
                            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost</th>
                            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(record => (
                            <tr key={record.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px', color: 'var(--color-text-primary)' }}>
                                    {new Date(record.created_at).toLocaleString()}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                            {record.request_type}
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                                            {record.model_name}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                            In: {record.input_tokens}
                                        </span>
                                        <span style={{ color: 'var(--color-border)' }}>|</span>
                                        <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                            Out: {record.output_tokens}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    ${record.cost.toFixed(6)}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    {record.user_id ? (
                                        <span className="user-badge" style={{ display: 'inline-flex', padding: '2px 8px', fontSize: '12px', height: 'auto' }}>
                                            ID: {record.user_id}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--color-text-tertiary)' }}>-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {history.length === 0 && !loading && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No usage records found.
                </div>
            )}
            
            <div style={{ 
                padding: '16px', 
                background: 'var(--color-surface)', 
                borderTop: '1px solid var(--color-border)', 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '8px' 
            }}>
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="btn-secondary"
                    style={{ height: '32px', padding: '0 16px', opacity: page === 1 ? 0.5 : 1 }}
                >
                    Previous
                </button>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0 12px', 
                    fontSize: '13px', 
                    fontWeight: 500, 
                    color: 'var(--color-text-secondary)' 
                }}>
                    Page {page}
                </div>
                <button 
                    onClick={() => setPage(p => p + 1)}
                    className="btn-secondary"
                    style={{ height: '32px', padding: '0 16px' }}
                >
                    Next
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
