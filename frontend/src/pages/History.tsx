/**
 * History Page
 * Unified view of all user activities.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, type HistoryItem } from '../api/client';

type FilterType = 'all' | 'chat' | 'validation' | 'generation';

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const filterParam = filter === 'all' ? undefined : filter;
      const data = await getHistory(filterParam);
      setItems(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: HistoryItem) => {
    switch (item.type) {
      case 'chat':
        navigate(`/lawyer?session=${item.id}`);
        break;
      case 'validation':
        navigate(`/validator?id=${item.id}`);
        break;
      case 'generation':
        navigate(`/generator?id=${item.id}`);
        break;
    }
  };

  return (
    <div className="history-page">
      <header className="page-header">
        <button onClick={() => navigate('/')} className="btn-back">← Назад</button>
        <h1>📚 История</h1>
      </header>

      <main className="history-content">
        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button 
            className={filter === 'chat' ? 'active' : ''} 
            onClick={() => setFilter('chat')}
          >
            💬 Чаты
          </button>
          <button 
            className={filter === 'validation' ? 'active' : ''} 
            onClick={() => setFilter('validation')}
          >
            ✅ Проверки
          </button>
          <button 
            className={filter === 'generation' ? 'active' : ''} 
            onClick={() => setFilter('generation')}
          >
            📝 Договоры
          </button>
        </div>

        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>История пуста</p>
            <p>Начните использовать AI Юрист, и ваши действия появятся здесь</p>
          </div>
        ) : (
          <div className="history-grid">
            {items.map((item) => (
              <div 
                key={`${item.type}-${item.id}`} 
                className="history-card"
                onClick={() => handleItemClick(item)}
              >
                <div className="card-header">
                  <span className="card-icon">{item.icon}</span>
                  <span className="card-type">
                    {item.type === 'chat' ? 'Консультация' : 
                     item.type === 'validation' ? 'Проверка' : 'Договор'}
                  </span>
                </div>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-preview">{item.preview}</p>
                <div className="card-footer">
                  <span className="card-date">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU') : ''}
                  </span>
                  {item.metadata.validity_score !== undefined && (
                    <span className={`card-score score-${
                      item.metadata.validity_score >= 80 ? 'green' : 
                      item.metadata.validity_score >= 50 ? 'yellow' : 'red'
                    }`}>
                      {item.metadata.validity_score}/100
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
