import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  analyzeDocument, 
  getDocumentValidationById,
} from '../api/client';
import type { 
  DocumentAudit,
  Source 
} from '../api/client';
import './DocumentValidator.css';

// Document type options
const DOCUMENT_TYPES = [
  { value: '', label: 'Автоматическое определение' },
  { value: 'power_of_attorney', label: 'Доверенность' },
  { value: 'corporate_resolution', label: 'Решение/Протокол' },
  { value: 'claim', label: 'Претензия/Иск' },
  { value: 'application', label: 'Заявление' },
  { value: 'agreement', label: 'Соглашение' },
  { value: 'act', label: 'Акт' },
  { value: 'order', label: 'Приказ' },
  { value: 'regulation', label: 'Положение' },
  { value: 'other', label: 'Другое' },
];

function getScoreColor(score: number): string {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-warning';
  return 'score-critical';
}

function getScoreEmoji(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
}

function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

// Collapsible section component
function Section({ 
  title, 
  score, 
  emoji, 
  isValid, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  score: number; 
  emoji: string;
  isValid?: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const statusEmoji = isValid === undefined ? '' : (isValid ? '✅' : '❌');
  
  return (
    <div className={`doc-section ${isOpen ? 'open' : ''}`}>
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="section-emoji">{emoji}</span>
        <span className="section-title">{title}</span>
        <span className="section-status">{statusEmoji}</span>
        <span className={`section-score ${getScoreColor(score)}`}>{score}/100</span>
        <span className="section-toggle">{isOpen ? '▼' : '▶'}</span>
      </div>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
}

function DocumentValidator() {
  const { analysisId } = useParams<{ analysisId?: string }>();
  const navigate = useNavigate();
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ audit: DocumentAudit; sources: Source[] } | null>(null);

  // Load existing analysis if ID provided
  useEffect(() => {
    if (analysisId) {
      loadExistingAnalysis(parseInt(analysisId));
    }
  }, [analysisId]);

  async function loadExistingAnalysis(id: number) {
    setLoading(true);
    setError('');
    try {
      const data = await getDocumentValidationById(id);
      setResult({
        audit: {
          overall_score: data.overall_score,
          document_type_detected: data.document_type || 'Документ',
          formal_validity: data.formal_validity as any,
          legal_validity: data.legal_validity as any,
          up_to_dateness: data.up_to_dateness as any,
          compliance_check: data.compliance_check as any,
          risk_analysis: data.risk_analysis as any,
          consistency_check: data.consistency_check as any,
          jurisdiction_intelligence: data.jurisdiction_intelligence as any,
          litigation_readiness: data.litigation_readiness as any,
          ethical_guardrails: data.ethical_guardrails as any,
          improvements: data.improvements as any,
          summary: data.summary || '',
          explainability: data.explainability || '',
        },
        sources: data.sources || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!documentText.trim() || loading) return;

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const data = await analyzeDocument(documentText, documentType || undefined);
      setResult({ audit: data.audit, sources: data.sources });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка анализа');
    } finally {
      setLoading(false);
    }
  }

  const audit = result?.audit;

  return (
    <div className="document-validator-page">
      <header className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">← Назад</button>
        <h1>📄 Проверка документа</h1>
      </header>

      <main className="validator-content">
        {!result && (
          <form onSubmit={handleSubmit} className="document-form">
          <div className="form-group">
            <label htmlFor="documentType">Тип документа (опционально)</label>
            <select 
              id="documentType" 
              value={documentType} 
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={loading}
            >
              {DOCUMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="documentText">Текст документа</label>
            <textarea
              id="documentText"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Вставьте полный текст документа для анализа...

Примеры документов:
• Доверенность
• Протокол собрания
• Претензия / Иск
• Приказ
• Соглашение"
              rows={15}
              disabled={loading}
            />
          </div>

          <button type="submit" className="analyze-btn" disabled={loading || !documentText.trim()}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Анализ документа...
              </>
            ) : (
              '🔍 Проверить документ'
            )}
          </button>

          {error && <div className="error-message">{error}</div>}
        </form>
        )}

      {/* Results */}
      {result && audit && (
        <div className="analysis-results">
          {/* Overall Score Header */}
          <div className={`overall-score-card ${getScoreColor(audit.overall_score)}`}>
            <div className="score-emoji">{getScoreEmoji(audit.overall_score)}</div>
            <div className="score-details">
              <div className="score-value">{audit.overall_score}/100</div>
              <div className="score-type">{audit.document_type_detected}</div>
            </div>
            <div className="score-verdict">
              {audit.overall_score >= 80 ? 'ДОКУМЕНТ СООТВЕТСТВУЕТ ТРЕБОВАНИЯМ' :
               audit.overall_score >= 60 ? 'ТРЕБУЮТСЯ НЕЗНАЧИТЕЛЬНЫЕ ИСПРАВЛЕНИЯ' :
               audit.overall_score >= 40 ? 'ТРЕБУЮТСЯ ЗНАЧИТЕЛЬНЫЕ ДОРАБОТКИ' :
               'КРИТИЧЕСКИЕ НАРУШЕНИЯ'}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-icon">📋</span>
              <span className="stat-value">{audit.formal_validity?.score || 0}</span>
              <span className="stat-label">Форма</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚖️</span>
              <span className="stat-value">{audit.legal_validity?.score || 0}</span>
              <span className="stat-label">Право</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🕐</span>
              <span className="stat-value">{audit.up_to_dateness?.score || 0}</span>
              <span className="stat-label">Актуальность</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🔍</span>
              <span className="stat-value">{audit.risk_analysis?.score || 0}</span>
              <span className="stat-label">Риски</span>
            </div>
          </div>

          {/* Collapsible Sections */}
          <div className="sections-container">
            
            {/* Formal Validity */}
            <Section 
              title="Формальная действительность" 
              emoji="📋" 
              score={audit.formal_validity?.score || 0}
              isValid={audit.formal_validity?.is_valid}
              defaultOpen={!audit.formal_validity?.is_valid}
            >
              <p className="section-explanation">{audit.formal_validity?.explanation}</p>
              {(audit.formal_validity?.issues?.length ?? 0) > 0 && (
                <ul className="issues-list">
                  {(audit.formal_validity?.issues ?? []).map((issue: any, i: number) => (
                    <li key={i} className={`issue-item severity-${issue.severity}`}>
                      <span className="issue-emoji">{getSeverityEmoji(issue.severity)}</span>
                      <div className="issue-content">
                        <strong>{issue.issue}</strong>
                        {issue.requirement && <div>Требование: {issue.requirement}</div>}
                        {issue.article && <div className="article-ref">{issue.article}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Legal Validity */}
            <Section 
              title="Правовая действительность" 
              emoji="⚖️" 
              score={audit.legal_validity?.score || 0}
              isValid={audit.legal_validity?.is_valid}
              defaultOpen={!audit.legal_validity?.is_valid}
            >
              <p className="section-explanation">{audit.legal_validity?.explanation}</p>
              {(audit.legal_validity?.applicable_laws?.length ?? 0) > 0 && (
                <div className="applicable-laws">
                  <strong>Применимые законы:</strong> {audit.legal_validity?.applicable_laws?.join(', ')}
                </div>
              )}
              {(audit.legal_validity?.issues?.length ?? 0) > 0 && (
                <ul className="issues-list">
                  {(audit.legal_validity?.issues ?? []).map((issue: any, i: number) => (
                    <li key={i} className={`issue-item severity-${issue.severity}`}>
                      <span className="issue-emoji">{getSeverityEmoji(issue.severity)}</span>
                      <div className="issue-content">
                        <strong>{issue.issue}</strong>
                        {issue.consequence && <div>Последствия: {issue.consequence}</div>}
                        {issue.article && <div className="article-ref">{issue.article}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Up-to-Dateness */}
            <Section 
              title="Актуальность" 
              emoji="🕐" 
              score={audit.up_to_dateness?.score || 0}
              isValid={audit.up_to_dateness?.is_current}
              defaultOpen={!audit.up_to_dateness?.is_current}
            >
              <p className="section-explanation">{audit.up_to_dateness?.explanation}</p>
              {audit.up_to_dateness?.outdated_references?.length > 0 && (
                <div className="outdated-list">
                  <h4>Устаревшие ссылки:</h4>
                  {audit.up_to_dateness.outdated_references.map((ref: any, i: number) => (
                    <div key={i} className="outdated-item">
                      <strong>⚠️ {ref.reference}</strong>
                      <div>Статус: {ref.status}</div>
                      <div>Актуальная норма: {ref.current_version}</div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Compliance */}
            <Section 
              title="Комплаенс" 
              emoji="✅" 
              score={audit.compliance_check?.score || 0}
              isValid={audit.compliance_check?.is_compliant}
              defaultOpen={!audit.compliance_check?.is_compliant}
            >
              <p className="section-explanation">{audit.compliance_check?.explanation}</p>
              {audit.compliance_check?.violations?.length > 0 && (
                <ul className="issues-list">
                  {audit.compliance_check.violations.map((v: any, i: number) => (
                    <li key={i} className="issue-item severity-high">
                      <span className="issue-emoji">🔴</span>
                      <div className="issue-content">
                        <strong>{v.violation}</strong>
                        <div>Требование: {v.requirement}</div>
                        <div>Регулятор: {v.regulator}</div>
                        {v.penalty && <div className="penalty">Санкция: {v.penalty}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Risk Analysis */}
            <Section 
              title="Анализ рисков" 
              emoji="🔍" 
              score={audit.risk_analysis?.score || 0}
              defaultOpen={audit.risk_analysis?.risk_level === 'high' || audit.risk_analysis?.risk_level === 'critical'}
            >
              <div className={`risk-level risk-${audit.risk_analysis?.risk_level}`}>
                Уровень риска: <strong>{(audit.risk_analysis?.risk_level || 'medium').toUpperCase()}</strong>
              </div>
              <p className="section-explanation">{audit.risk_analysis?.explanation}</p>
              {audit.risk_analysis?.risks?.length > 0 && (
                <ul className="risks-list">
                  {audit.risk_analysis.risks.map((r: any, i: number) => (
                    <li key={i} className="risk-item">
                      <strong>{r.risk}</strong>
                      <div className="risk-meta">
                        Вероятность: {r.probability} | Влияние: {r.impact} | Категория: {r.category}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {audit.risk_analysis?.mitigation_suggestions?.length > 0 && (
                <div className="mitigations">
                  <h4>Рекомендации по снижению:</h4>
                  <ul>
                    {audit.risk_analysis.mitigation_suggestions.map((m: string, i: number) => (
                      <li key={i}>✅ {m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>

            {/* Consistency Check (NEW) */}
            <Section 
              title="Согласованность" 
              emoji="🔗" 
              score={audit.consistency_check?.score || 0}
              isValid={audit.consistency_check?.is_consistent}
            >
              <p className="section-explanation">{audit.consistency_check?.explanation}</p>
              {audit.consistency_check?.inconsistencies?.length > 0 && (
                <ul className="issues-list">
                  {audit.consistency_check.inconsistencies.map((inc: any, i: number) => (
                    <li key={i} className={`issue-item severity-${inc.severity}`}>
                      <span className="issue-emoji">{getSeverityEmoji(inc.severity)}</span>
                      <div className="issue-content">
                        <strong>{inc.issue}</strong>
                        <div>Место 1: {inc.location1}</div>
                        <div>Место 2: {inc.location2}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Jurisdiction Intelligence (NEW) */}
            <Section 
              title="Юрисдикция" 
              emoji="🌍" 
              score={audit.jurisdiction_intelligence?.score || 0}
            >
              <div className="jurisdiction-info">
                <strong>Основная юрисдикция:</strong> {audit.jurisdiction_intelligence?.primary_jurisdiction || 'Узбекистан'}
              </div>
              <p className="section-explanation">{audit.jurisdiction_intelligence?.explanation}</p>
              {audit.jurisdiction_intelligence?.applicable_courts?.length > 0 && (
                <div className="courts-list">
                  <strong>Компетентные суды:</strong> {audit.jurisdiction_intelligence.applicable_courts.join(', ')}
                </div>
              )}
              {audit.jurisdiction_intelligence?.statute_of_limitations && (
                <div className="limitations-info">
                  <strong>Срок давности:</strong> {audit.jurisdiction_intelligence.statute_of_limitations.applicable_period} 
                  ({audit.jurisdiction_intelligence.statute_of_limitations.article})
                </div>
              )}
            </Section>

            {/* Litigation Readiness (NEW) */}
            <Section 
              title="Готовность к суду" 
              emoji="⚔️" 
              score={audit.litigation_readiness?.score || 0}
            >
              <div className={`readiness-level readiness-${audit.litigation_readiness?.readiness_level}`}>
                Уровень готовности: <strong>{(audit.litigation_readiness?.readiness_level || 'medium').toUpperCase()}</strong>
              </div>
              <p className="section-explanation">{audit.litigation_readiness?.explanation}</p>
              {audit.litigation_readiness?.evidence_gaps?.length > 0 && (
                <div className="evidence-gaps">
                  <h4>Пробелы в доказательствах:</h4>
                  {audit.litigation_readiness.evidence_gaps.map((gap: any, i: number) => (
                    <div key={i} className="gap-item">
                      <strong>📌 {gap.gap}</strong>
                      <div>Необходимо: {gap.required_evidence}</div>
                      <div>Как получить: {gap.how_to_obtain}</div>
                    </div>
                  ))}
                </div>
              )}
              {audit.litigation_readiness?.litigation_strategy?.length > 0 && (
                <div className="strategies">
                  <h4>Стратегические рекомендации:</h4>
                  <ul>
                    {audit.litigation_readiness.litigation_strategy.map((s: string, i: number) => (
                      <li key={i}>💡 {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>

            {/* Ethical Guardrails (NEW) */}
            <Section 
              title="Этика и добросовестность" 
              emoji="⚖️" 
              score={audit.ethical_guardrails?.score || 0}
              isValid={audit.ethical_guardrails?.passes_ethics}
            >
              <p className="section-explanation">{audit.ethical_guardrails?.explanation}</p>
              {audit.ethical_guardrails?.ethical_concerns?.length > 0 && (
                <ul className="issues-list">
                  {audit.ethical_guardrails.ethical_concerns.map((c: any, i: number) => (
                    <li key={i} className={`issue-item severity-${c.severity}`}>
                      <span className="issue-emoji">{getSeverityEmoji(c.severity)}</span>
                      <div className="issue-content">
                        <strong>{c.concern}</strong>
                        <div>Рекомендация: {c.recommendation}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {audit.ethical_guardrails?.unfair_terms?.length > 0 && (
                <div className="unfair-terms">
                  <h4>Несправедливые условия:</h4>
                  {audit.ethical_guardrails.unfair_terms.map((u: any, i: number) => (
                    <div key={i} className="unfair-item">
                      <strong>⚠️ {u.term}</strong>
                      <div>Почему: {u.why_unfair}</div>
                      <div className="fix-suggestion">Исправление: {u.fix}</div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Improvements */}
            {audit.improvements?.length > 0 && (
              <div className="improvements-section">
                <h2>🛠️ Рекомендуемые исправления</h2>
                {audit.improvements.map((imp, i) => (
                  <div key={i} className={`improvement-card priority-${imp.priority}`}>
                    <div className="improvement-header">
                      <span className="priority-badge">{getSeverityEmoji(imp.priority)} {imp.priority.toUpperCase()}</span>
                      <strong>{imp.issue}</strong>
                    </div>
                    <div className="improvement-location">📍 {imp.location}</div>
                    {imp.current_text && (
                      <div className="text-block current">
                        <div className="text-label">Текущий текст:</div>
                        <pre>{imp.current_text}</pre>
                      </div>
                    )}
                    <div className="text-block suggested">
                      <div className="text-label">Предлагаемый текст:</div>
                      <pre>{imp.suggested_text}</pre>
                    </div>
                    <div className="improvement-explanation">{imp.explanation}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {audit.summary && (
              <div className="summary-section">
                <h2>📌 Заключение</h2>
                <p>{audit.summary}</p>
              </div>
            )}

            {/* Explainability */}
            {audit.explainability && (
              <div className="explainability-section">
                <h2>💡 Объяснение для неюриста</h2>
                <p>{audit.explainability}</p>
              </div>
            )}

            {/* Sources */}
            {(result.sources?.length ?? 0) > 0 && (
              <div className="sources-section">
                <h2>📚 Источники</h2>
                <ul className="sources-list">
                  {result.sources.slice(0, 10).map((source: any, i: number) => (
                    <li key={i} className="source-item">
                      <span className="source-name">{source.source}</span>
                      {source.article && (
                        <span className="source-article">{source.article}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* New Analysis Button */}
          <button 
            className="new-analysis-btn" 
            onClick={() => {
              setResult(null);
              setDocumentText('');
              setDocumentType('');
            }}
          >
            📄 Проверить другой документ
          </button>
        </div>
      )}
      </main>
    </div>
  );
}

export default DocumentValidator;
