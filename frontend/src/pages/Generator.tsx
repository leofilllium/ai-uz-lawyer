/**
 * Contract Generator Page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getCategories, generateContract, type ContractCategory, type Source } from '../api/client';

export default function Generator() {
  const [categories, setCategories] = useState<ContractCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [requirements, setRequirements] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError('Не удалось загрузить категории');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !requirements.trim() || loading) return;

    setError('');
    setLoading(true);
    setGeneratedText('');
    setSources([]);

    try {
      await generateContract(
        selectedCategory,
        requirements,
        (chunk) => {
          setGeneratedText((prev) => prev + chunk);
        },
        (contractId, newSources) => {
          setSources(newSources);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка генерации');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    alert('Договор скопирован в буфер обмена');
  };

  return (
    <div className="generator-page">
      <header className="page-header">
        <button onClick={() => navigate('/')} className="btn-back">← Назад</button>
        <h1>📝 Генератор договоров</h1>
      </header>

      <main className="generator-content">
        <form onSubmit={handleSubmit} className="generator-form">
          <div className="form-group">
            <label>Категория договора</label>
            {loadingCategories ? (
              <p>Загрузка категорий...</p>
            ) : (
              <div className="category-grid">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    className={`category-btn ${selectedCategory === cat.name ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    <span className="category-icon">{cat.description}</span>
                    <span className="category-name">{cat.name}</span>
                    <span className="category-count">{cat.count} шаблонов</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Требования к договору</label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Опишите стороны, предмет договора, условия, сроки, суммы и другие важные детали..."
              rows={6}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !selectedCategory || requirements.length < 20}
            className="btn-generate"
          >
            {loading ? 'Генерация...' : 'Сгенерировать договор'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {generatedText && (
          <div className="generated-result">
            <div className="result-header">
              <h2>📄 Сгенерированный договор</h2>
              <button onClick={copyToClipboard} className="btn-copy">
                📋 Копировать
              </button>
            </div>
            <div className="contract-content">
              <ReactMarkdown>{generatedText}</ReactMarkdown>
            </div>

            {sources.length > 0 && (
              <details className="sources-expander">
                <summary>📚 Правовая основа ({sources.length})</summary>
                <ul className="sources-list">
                  {sources.map((source, i) => (
                    <li key={i}>
                      <strong>Статья {source.article}</strong> — {source.source}
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
