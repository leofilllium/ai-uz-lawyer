/**
 * Contract Validator Page
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzeContract, getValidationById, type ContractAnalysis as Analysis } from '../api/client';
import './Validator.css';

export default function Validator() {
  const [contractText, setContractText] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Load existing validation if ID is in URL
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) {
        loadValidation(id);
      }
    }
  }, [searchParams]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка анализа');
    } finally {
      setLoading(false);
    }
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
        <button onClick={() => navigate('/dashboard')} className="btn-back">← Назад</button>
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
          <button type="submit" disabled={loading || contractText.length < 50}>
            {loading ? 'Анализ...' : 'Проверить договор'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className="analysis-result">
            <div className={`score-card ${getScoreColor(result.validity_score)}`}>
              <span className="score-emoji">{getScoreEmoji(result.validity_score)}</span>
              <span className="score-value">{result.validity_score}/100</span>
              <span className="score-label">
                {result.validity_score >= 80 ? 'ДОПУСТИМО' : 
                 result.validity_score >= 50 ? 'ТРЕБУЕТ ДОРАБОТКИ' : 'ВЫСОКИЙ РИСК'}
              </span>
              {result.strictness_level === 'maximum' && (
                <div className="strictness-badge">
                  🔒 RUTHLESS AUDITOR MODE
                </div>
              )}
            </div>

            {result.score_explanation && (
              <div className="score-explanation">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.score_explanation}</ReactMarkdown>
              </div>
            )}

            {result.critical_errors && result.critical_errors.length > 0 && (
              <section className="errors-section">
                <h2>❌ Критические ошибки</h2>
                {result.critical_errors.map((err, i) => (
                  <div key={i} className="error-card">
                    <h3>{err.error}</h3>
                    <p><strong>Статья:</strong> {err.article}</p>
                    <div className="fix-suggestion">
                      <strong>Исправление:</strong>
                      <pre>{err.fix}</pre>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Hidden Risks Section */}
            {result.hidden_risks && result.hidden_risks.length > 0 && (
              <section className="risks-section">
                <h2>🕵️ Скрытые угрозы и ловушки</h2>
                <div className="section-subtitle">Пункты, которые юридически корректны, но опасны для вас</div>
                {result.hidden_risks.map((risk, i) => (
                  <div key={i} className={`risk-card ${risk.severity.toLowerCase()}`}>
                    <div className="risk-header">
                      <h3>{risk.severity.toLowerCase() === 'high' ? '💣' : '⚠️'} {risk.risk}</h3>
                      <span className={`severity-tag ${risk.severity.toLowerCase()}`}>{risk.severity}</span>
                    </div>
                    <p><strong>Где найдено:</strong> {risk.location}</p>
                    <div className="mitigation-box">
                      <strong>Как обезвредить:</strong>
                      <p>{risk.mitigation}</p>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Ambiguities Section */}
            {result.ambiguities && result.ambiguities.length > 0 && (
              <section className="ambiguities-section">
                <h2>🌫️ Размытые формулировки</h2>
                <div className="section-subtitle">Фразы, которые можно трактовать двояко в суде</div>
                <div className="ambiguities-grid">
                  {result.ambiguities.map((amb, i) => (
                    <div key={i} className="ambiguity-card">
                      <div className="ambiguity-phrase">"{amb.phrase}"</div>
                      <div className="ambiguity-risk">⚠️ {amb.risk}</div>
                      <div className="ambiguity-fix">
                        <strong>Лучше написать:</strong>
                        <code>{amb.suggestion}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.warnings && result.warnings.length > 0 && (
              <section className="warnings-section">
                <h2>⚠️ Предупреждения</h2>
                {result.warnings.map((warn, i) => (
                  <div key={i} className="warning-card">
                    <h3>{warn.risk}</h3>
                    <p>{warn.explanation}</p>
                    <p><strong>Рекомендация:</strong> {warn.suggestion}</p>
                  </div>
                ))}
              </section>
            )}

            {result.missing_clauses && result.missing_clauses.length > 0 && (
              <section className="missing-section">
                <h2>📝 Недостающие пункты</h2>
                {result.missing_clauses.map((clause, i) => (
                  <div key={i} className="missing-card">
                    <h3>{clause.clause_name}</h3>
                    <p><strong>Основание:</strong> {clause.article_reference}</p>
                    <pre className="drafted-text">{clause.drafted_text}</pre>
                  </div>
                ))}
              </section>
            )}

            {/* Negotiation Strategy */}
            {result.negotiation_strategy && (
              <section className="strategy-section">
                <h2>🤝 Стратегия переговоров</h2>
                <div className="strategy-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.negotiation_strategy}</ReactMarkdown>
                </div>
              </section>
            )}

            {result.summary && (
              <section className="summary-section">
                <h2>📌 Заключение</h2>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.summary}</ReactMarkdown>
              </section>
            )}

            {result.sources && result.sources.length > 0 && (
              <details className="sources-expander" open>
                <summary>📚 Правовая основа ({result.sources.length})</summary>
                <ul className="sources-list detailed">
                  {result.sources.map((source, i) => (
                    <li key={i} id={`validator-source-${i}`} className="source-item-entry">
                      <div className="source-header-info">
                        <strong>{source.source}</strong>
                        <span className="source-article-badge">Статья {source.article}</span>
                        {source.similarity && (
                          <span className="source-similarity">{source.similarity}</span>
                        )}
                      </div>
                      {source.title && <div className="source-title">{source.title}</div>}
                      {source.chapter && <div className="source-chapter">{source.chapter}</div>}
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
