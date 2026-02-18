/**
 * Contract Validator Page
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzeContract, getValidationById, fixContractWithAi, type ContractAnalysis as Analysis } from '../api/client';

export default function Validator() {
  const [contractText, setContractText] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixedContract, setFixedContract] = useState<string | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Load existing validation if ID is in URL
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) {
        // Prevent reloading if we already have this result
        if (result?.id === id) return;
        loadValidation(id);
      }
    }
  }, [searchParams, result?.id]);

  const loadValidation = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await getValidationById(id);
      setResult(data);
      if (data.contract_preview) {
        setContractText(data.contract_preview);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить анализ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractText.trim() || loading) return;

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const data = await analyzeContract(contractText);
      setResult(data);
      // Persist by updating URL with the new analysis ID
      if (data.id) {
        navigate(`?id=${data.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка анализа');
    } finally {
      setLoading(false);
    }
  };

  const handleFix = async () => {
    if (!result?.id || fixing) return;

    setFixing(true);
    setError('');
    try {
      const data = await fixContractWithAi(result.id);
      setFixedContract(data.fixed_contract);
      // Scroll to result
      setTimeout(() => {
        document.getElementById('fixed-contract-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось исправить договор');
    } finally {
      setFixing(false);
    }
  };

  const handleCopyFixed = () => {
    if (!fixedContract) return;
    navigator.clipboard.writeText(fixedContract);
    alert('Текст скопирован в буфер обмена');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 50) return 'yellow';
    return 'red';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🟢';
    if (score >= 50) return '🟡';
    return '🔴';
  };

  return (
    <div className="validator-page">
      <header className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">← Назад</button>
        <h1>✅ Проверка договора</h1>
      </header>

      <main className="validator-content">
        <form onSubmit={handleSubmit} className="validator-form">
          <textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="Вставьте текст договора для анализа (минимум 50 символов)..."
            rows={12}
            disabled={loading}
          />
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading || contractText.length < 50}>
              {loading ? 'Анализ...' : 'Проверить договор'}
            </button>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className="analysis-result">
            {/* Score Card */}
            <div className={`score-card ${getScoreColor(result.validity_score)}`}>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <span className="score-emoji">{getScoreEmoji(result.validity_score)}</span>
                <span className="score-value">{result.validity_score}/100</span>
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                <span className="score-label">
                  {result.validity_score >= 90 ? 'ДОПУСТИМО (ИДЕАЛ)' : 
                   result.validity_score >= 75 ? 'ТРЕБУЕТ ДОРАБОТКИ' : 
                   result.validity_score >= 50 ? 'РИСКОВАНО' : 'КРИТИЧЕСКИ ОПАСНО'}
                </span>
                
                {result.validity_score < 95 && (
                  <button 
                    onClick={handleFix} 
                    className="btn-fix-ai"
                    disabled={fixing}
                  >
                    {fixing ? '✨ Исправление...' : '✨ Исправить с ИИ'}
                  </button>
                )}
              </div>
            </div>

            {/* Fixed Contract Result */}
            {fixedContract && (
              <section id="fixed-contract-section" className="analysis-section fixed-contract-container">
                <div className="section-header-row">
                  <h2>✨ Исправленный договор</h2>
                  <button onClick={handleCopyFixed} className="btn-secondary btn-sm">Копировать</button>
                </div>
                <div className="fixed-text-area">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{fixedContract}</ReactMarkdown>
                </div>
              </section>
            )}

            {/* Score Explanation */}
            {result.score_explanation && (
              <div className="score-explanation">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.score_explanation}</ReactMarkdown>
              </div>
            )}

            {/* Critical Errors */}
            {result.critical_errors && result.critical_errors.length > 0 && (
              <section className="analysis-section">
                <h2>❌ Критические ошибки</h2>
                {result.critical_errors.map((err, i) => (
                  <div key={i} className="error-card">
                    <div className="card-title">🛑 {err.error}</div>
                    <div className="card-meta">Статья: {err.article}</div>
                    <div className="fix-suggestion">
                      <label>Исправление</label>
                      <pre>{err.fix}</pre>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Hidden Risks (New) */}
            {result.hidden_risks && result.hidden_risks.length > 0 && (
              <section className="analysis-section">
                <h2>🕵️ Скрытые угрозы и ловушки</h2>
                {result.hidden_risks.map((risk, i) => (
                  <div key={i} className="risk-card">
                    <div className="card-title">💣 {risk.risk}</div>
                    <div className="card-meta">
                      Где: {risk.location} • Тяжесть: {risk.severity.toUpperCase()}
                    </div>
                    <p style={{marginTop: '8px', fontSize: '0.95rem'}}>
                      <strong>Как обезвредить:</strong> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </section>
            )}

            {/* Ambiguities (New) */}
            {result.ambiguities && result.ambiguities.length > 0 && (
              <section className="analysis-section">
                <h2>🌫️ Размытые формулировки</h2>
                {result.ambiguities.map((amb, i) => (
                  <div key={i} className="ambiguity-card">
                    <div className="card-title">"{amb.phrase}"</div>
                    <p style={{marginBottom: '8px', color: 'var(--color-error)'}}>{amb.risk}</p>
                    <div className="fix-suggestion">
                      <label>Лучше написать</label>
                      <pre>{amb.suggestion}</pre>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <section className="analysis-section">
                <h2>⚠️ Предупреждения</h2>
                {result.warnings.map((warn, i) => (
                  <div key={i} className="warning-card">
                    <div className="card-title">{warn.risk}</div>
                    <p>{warn.explanation}</p>
                    <p style={{marginTop: '8px'}}>👉 <strong>Рекомендация:</strong> {warn.suggestion}</p>
                  </div>
                ))}
              </section>
            )}

            {/* Missing Clauses */}
            {result.missing_clauses && result.missing_clauses.length > 0 && (
              <section className="analysis-section">
                <h2>📝 Недостающие пункты</h2>
                {result.missing_clauses.map((clause, i) => (
                  <div key={i} className="missing-card">
                    <div className="card-title">🔹 {clause.clause_name}</div>
                    <div className="card-meta">Основание: {clause.article_reference}</div>
                    <div className="fix-suggestion">
                      <pre>{clause.drafted_text}</pre>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Negotiation Strategy (New) */}
            {result.negotiation_strategy && (
              <section className="analysis-section">
                <h2>🤝 Стратегия переговоров</h2>
                <div style={{whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.negotiation_strategy}</ReactMarkdown>
                </div>
              </section>
            )}

            {/* Summary */}
            {result.summary && (
              <section className="analysis-section">
                <h2>📌 Заключение</h2>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.summary}</ReactMarkdown>
              </section>
            )}

            {/* Sources */}
            {result.sources && result.sources.length > 0 && (
              <details className="sources-expander" open>
                <summary>📚 Правовая основа ({result.sources.length})</summary>
                <ul className="sources-list detailed">
                  {result.sources.map((source, i) => (
                    <li key={i} id={`validator-source-${i}`} className="source-item-entry">
                      <div className="source-header-info">
                        <strong>{source.source}</strong>
                        <span className="source-article-badge">Статья {source.article}</span>
                      </div>
                      {source.preview && (
                        <div className="source-preview">{source.preview.substring(0, 200)}...</div>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
