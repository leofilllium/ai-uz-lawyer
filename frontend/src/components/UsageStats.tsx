import { useState, useEffect, useCallback } from 'react';
import { statsApi, type UsageStatsSummary, type UsageRecord, type FeatureStats } from '../api/stats';
import { FileText, BarChart2, Coins, Zap, Scale, ShieldCheck, FileCheck, FileOutput, HelpCircle, Filter } from 'lucide-react';

interface UsageStatsProps {
  authHeader?: string;
}

const FEATURE_LABELS: Record<string, { label: string; icon: typeof Scale; color: string }> = {
  lawyer: { label: 'AI Lawyer Chat', icon: Scale, color: 'var(--color-primary)' },
  validator: { label: 'Contract Validator', icon: ShieldCheck, color: 'var(--color-warning, #f59e0b)' },
  generator: { label: 'Contract Generator', icon: FileOutput, color: 'var(--color-success)' },
  generator_ultra: { label: 'Generator Ultra', icon: Zap, color: 'var(--color-gold, #d97706)' },
  doc_validator: { label: 'Document Validator', icon: FileCheck, color: 'var(--color-info)' },
  other: { label: 'Other', icon: HelpCircle, color: 'var(--color-text-tertiary)' },
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  contract_validation: 'Contract Validation',
  contract_type_detection: 'Contract Type Detection',
  contract_generation_legacy: 'Contract Generation',
  contract_ultra_phase1_draft: 'Ultra — Draft',
  contract_ultra_phase2_audit: 'Ultra — Audit',
  contract_ultra_phase2_redteam: 'Ultra — Red Team',
  contract_ultra_phase2_risktest: 'Ultra — Risk Test',
  contract_ultra_phase3_final: 'Ultra — Final',
  document_analysis: 'Document Analysis',
};

function formatRequestType(rt: string): string {
  if (REQUEST_TYPE_LABELS[rt]) return REQUEST_TYPE_LABELS[rt];
  // Dynamic chat modes: agentic_step_commercial → "Commercial — RAG Step"
  if (rt.startsWith('agentic_step_')) {
    const mode = rt.replace('agentic_step_', '');
    return `${mode.charAt(0).toUpperCase() + mode.slice(1)} — RAG Step`;
  }
  if (rt.startsWith('agentic_final_')) {
    const mode = rt.replace('agentic_final_', '');
    return `${mode.charAt(0).toUpperCase() + mode.slice(1)} — Final Answer`;
  }
  if (rt.startsWith('chat_simple_')) {
    const mode = rt.replace('chat_simple_', '');
    return `${mode.charAt(0).toUpperCase() + mode.slice(1)} — Simple Chat`;
  }
  return rt;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export default function UsageStats({ authHeader }: UsageStatsProps) {
  const [summary, setSummary] = useState<UsageStatsSummary | null>(null);
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');
  const [filterFeature, setFilterFeature] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const summaryData = await statsApi.getSummary(undefined, undefined, authHeader);
      setSummary(summaryData);

      const historyData = await statsApi.getHistory(
        (page - 1) * pageSize, pageSize, undefined, authHeader,
        filterFeature || undefined
      );
      setHistory(historyData);
    } catch (err) {
      console.error(err);
      setError('Failed to load usage statistics');
    } finally {
      setLoading(false);
    }
  }, [authHeader, page, filterFeature]);

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
      <div className="error-message" style={{ margin: 'var(--space-lg)' }}>{error}</div>
    );
  }

  const tabBtnStyle = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: active ? 'var(--color-background)' : 'transparent',
    color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    fontWeight: 600 as const,
    fontSize: '13px',
    cursor: 'pointer' as const,
    boxShadow: active ? 'var(--shadow-sm)' : 'none',
    transition: 'all 0.2s ease'
  });

  return (
    <div className="usage-stats-container">
      {/* Header & Tabs */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--space-xl)', flexWrap: 'wrap' as const, gap: 'var(--space-md)'
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            AI Usage Analytics
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Track token consumption and costs across all features
          </p>
        </div>

        <div style={{
          display: 'flex', gap: 'var(--space-xs)', background: 'var(--color-surface)',
          padding: '4px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)'
        }}>
          <button onClick={() => setActiveTab('summary')} style={tabBtnStyle(activeTab === 'summary')}>Overview</button>
          <button onClick={() => setActiveTab('history')} style={tabBtnStyle(activeTab === 'history')}>History</button>
        </div>
      </div>

      {activeTab === 'summary' && summary && (
        <>
          {/* Totals Row */}
          <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 'var(--space-xl)' }}>
            <div className="bento-card"><div className="bento-card__inner">
              <div className="bento-card__header">
                <div className="bento-card__icon" style={{ '--card-accent': 'var(--color-info)' } as any}><BarChart2 size={24} /></div>
              </div>
              <div className="bento-card__title">Total Requests</div>
              <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-display)' }}>{summary.total_requests}</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>All time API calls</div>
            </div></div>

            <div className="bento-card"><div className="bento-card__inner" style={{ borderColor: 'var(--color-gold-glow)' }}>
              <div className="bento-card__header">
                <div className="bento-card__icon" style={{ '--card-accent': 'var(--color-gold)' } as any}><Coins size={24} /></div>
              </div>
              <div className="bento-card__title">Total Cost</div>
              <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-display)', color: 'var(--color-gold, #d97706)' }}>
                ${summary.total_cost.toFixed(4)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>Estimated API costs (USD)</div>
            </div></div>

            <div className="bento-card"><div className="bento-card__inner">
              <div className="bento-card__header">
                <div className="bento-card__icon" style={{ '--card-accent': 'var(--color-primary)' } as any}><FileText size={24} /></div>
              </div>
              <div className="bento-card__title">Input Tokens</div>
              <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-display)' }}>
                {formatTokens(summary.total_input_tokens)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>Prompt consumption</div>
            </div></div>

            <div className="bento-card"><div className="bento-card__inner">
              <div className="bento-card__header">
                <div className="bento-card__icon" style={{ '--card-accent': 'var(--color-success)' } as any}><Zap size={24} /></div>
              </div>
              <div className="bento-card__title">Output Tokens</div>
              <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-display)' }}>
                {formatTokens(summary.total_output_tokens)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>Generation volume</div>
            </div></div>
          </div>

          {/* Per-Feature Breakdown */}
          {summary.by_feature.length > 0 && (
            <>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-md)' }}>
                Cost by Feature
              </h3>
              <div style={{
                background: 'var(--color-background)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
              }}>
                {summary.by_feature.map((f: FeatureStats) => {
                  const meta = FEATURE_LABELS[f.feature] || FEATURE_LABELS.other;
                  const Icon = meta.icon;
                  const pct = summary.total_cost > 0 ? (f.cost / summary.total_cost * 100) : 0;
                  return (
                    <div key={f.feature} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                      padding: '16px 20px', borderBottom: '1px solid var(--color-border)'
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-md)',
                        background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Icon size={20} style={{ color: meta.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>{meta.label}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                          {f.requests} requests &middot; {formatTokens(f.input_tokens)} in &middot; {formatTokens(f.output_tokens)} out
                        </div>
                        {/* Progress bar */}
                        <div style={{
                          marginTop: '6px', height: '4px', borderRadius: '2px',
                          background: 'var(--color-surface)', overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%', borderRadius: '2px', background: meta.color,
                            width: `${Math.max(pct, 1)}%`, transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                          ${f.cost.toFixed(4)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                          {pct.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div style={{
          background: 'var(--color-background)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Feature filter */}
          <div style={{
            padding: '12px 16px', background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Filter size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            <select
              value={filterFeature}
              onChange={e => { setFilterFeature(e.target.value); setPage(1); }}
              style={{
                background: 'var(--color-background)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: '6px 10px', fontSize: '13px',
                color: 'var(--color-text-primary)', cursor: 'pointer'
              }}
            >
              <option value="">All Features</option>
              {Object.entries(FEATURE_LABELS).filter(([k]) => k !== 'other').map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                  {['Time', 'Feature', 'Type / Model', 'Tokens (In / Out)', 'Cost', 'User'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)',
                      fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(record => {
                  const meta = FEATURE_LABELS[record.feature] || FEATURE_LABELS.other;
                  const Icon = meta.icon;
                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-primary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                          background: `color-mix(in srgb, ${meta.color} 12%, transparent)`, color: meta.color
                        }}>
                          <Icon size={13} />
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '13px' }}>
                            {formatRequestType(record.request_type)}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                            {record.model_name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {formatTokens(record.input_tokens)}
                        </span>
                        <span style={{ color: 'var(--color-border)', margin: '0 6px' }}>|</span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                          {formatTokens(record.output_tokens)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                        ${record.cost.toFixed(6)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {record.user_id ? (
                          <span className="user-badge" style={{ display: 'inline-flex', padding: '2px 8px', fontSize: '12px', height: 'auto' }}>
                            ID: {record.user_id}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {history.length === 0 && !loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              No usage records found.
            </div>
          )}

          <div style={{
            padding: '16px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
            display: 'flex', justifyContent: 'center', gap: '8px'
          }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn-secondary"
              style={{ height: '32px', padding: '0 16px', opacity: page === 1 ? 0.5 : 1 }}
            >Previous</button>
            <div style={{
              display: 'flex', alignItems: 'center', padding: '0 12px',
              fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)'
            }}>Page {page}</div>
            <button
              disabled={history.length < pageSize}
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary"
              style={{ height: '32px', padding: '0 16px', opacity: history.length < pageSize ? 0.5 : 1 }}
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
