/**
 * History Page
 * Unified view of all user activities.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteHistoryItem, type HistoryItem } from '../api/client';

type FilterType = 'all' | 'chat' | 'validation' | 'generation' | 'document_validation';

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async (reset = true) => {
    if (reset) setLoading(true);
    
    try {
      const filterParam = filter === 'all' ? undefined : filter;
      const currentOffset = reset ? 0 : offset;
      
      const data = await getHistory(filterParam, currentOffset, LIMIT);
      
      if (reset) {
        setItems(data);
        setOffset(LIMIT);
      } else {
        setItems((prev) => [...prev, ...data]);
        setOffset((prev) => prev + LIMIT);
      }
      
      setHasMore(data.length === LIMIT);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      if (reset) setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadHistory(false);
  };

  const handleItemClick = (item: HistoryItem) => {
    switch (item.type) {
      case 'chat':
        navigate(`/lawyer?session=${item.id}`);
        break;
      case 'validation':
        navigate(`/validator?id=${item.id}`);
        break;
      case 'document_validation':
        navigate(`/document-validator/${item.id}`);
        break;
      case 'generation':
        navigate(`/generator?id=${item.id}`);
        break;
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation(); // Prevent navigation
    
    if (!confirm('Удалить эту запись?')) return;
    
    try {
      await deleteHistoryItem(item.type, item.id);
      setItems((prev) => prev.filter((i) => !(i.type === item.type && i.id === item.id)));
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Ошибка удаления');
    }
  };

  return (
    <div className="history-page">
      <header className="page-header">
        <button onClick={() => navigate('/')} className="btn-back">← Назад</button>
        <h1>📚 История</h1>
      </header>

      <main className="history-page-content">
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
            ✅ Договоры
          </button>
          <button 
            className={filter === 'document_validation' ? 'active' : ''} 
            onClick={() => setFilter('document_validation')}
          >
            📄 Документы
          </button>
          <button 
            className={filter === 'generation' ? 'active' : ''} 
            onClick={() => setFilter('generation')}
          >
            📝 Генерация
          </button>
        </div>

        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>История пуста</p>
            <p>Начните использовать AI Юрист, и ваши консультации, проверки и документы появятся здесь</p>
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
                     item.type === 'validation' ? 'Проверка договора' : 
                     item.type === 'document_validation' ? 'Проверка документа' : 'Договор'}
                  </span>
                </div>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-preview">{item.preview}</p>
                <div className="card-footer">
                  <span className="card-date">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU') : ''}
                  </span>
                  <div className="card-actions">
                    {item.metadata.validity_score !== undefined && (
                      <span className={`card-score score-${
                        item.metadata.validity_score >= 80 ? 'green' : 
                        item.metadata.validity_score >= 50 ? 'yellow' : 'red'
                      }`}>
                        {item.metadata.validity_score}/100
                      </span>
                    )}
                    <button 
                      className="btn-delete" 
                      onClick={(e) => handleDelete(e, item)}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && !loading && items.length > 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '20px' }}>
                <button 
                  onClick={handleLoadMore}
                  className="btn-primary"
                  style={{ minWidth: '200px' }}
                >
                  Загрузить еще
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
