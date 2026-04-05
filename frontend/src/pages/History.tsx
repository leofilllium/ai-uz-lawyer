/**
 * History Page — Editorial flat list
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteHistoryItem, type HistoryItem } from '../api/client';

type FilterType = 'all' | 'chat' | 'validation' | 'generation' | 'document_validation';

const TYPE_LABELS: Record<string, string> = {
  chat: 'Консультация',
  validation: 'Проверка договора',
  document_validation: 'Проверка документа',
  generation: 'Договор',
};

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'chat', label: 'Чаты' },
  { key: 'validation', label: 'Договоры' },
  { key: 'document_validation', label: 'Документы' },
  { key: 'generation', label: 'Генерация' },
];

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

  const handleItemClick = (item: HistoryItem) => {
    switch (item.type) {
      case 'chat': navigate(`/lawyer?session=${item.id}`); break;
      case 'validation': navigate(`/validator?id=${item.id}`); break;
      case 'document_validation': navigate(`/document-validator/${item.id}`); break;
      case 'generation': navigate(`/generator?id=${item.id}`); break;
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
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
        <button onClick={() => navigate('/dashboard')} className="btn-back">← Назад</button>
        <h1>История</h1>
      </header>

      <main className="history-page-content">
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? 'active' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>История пуста</p>
            <p>Начните использовать AI Юрист, и ваши записи появятся здесь</p>
          </div>
        ) : (
          <>
            <div className="history-list">
              {items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="history-row"
                  onClick={() => handleItemClick(item)}
                >
                  <span className="history-row__type">{TYPE_LABELS[item.type] || item.type}</span>
                  <span className="history-row__title">{item.title}</span>
                  {item.metadata.validity_score !== undefined && (
                    <span className={`history-row__score history-row__score--${
                      item.metadata.validity_score >= 80 ? 'good' :
                      item.metadata.validity_score >= 50 ? 'warn' : 'bad'
                    }`}>
                      {item.metadata.validity_score}
                    </span>
                  )}
                  <span className="history-row__date">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                  <button
                    className="history-row__del"
                    onClick={(e) => handleDelete(e, item)}
                    title="Удалить"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            {hasMore && !loading && items.length > 0 && (
              <div className="history-load-more">
                <button onClick={() => loadHistory(false)} className="btn-primary">
                  Загрузить еще
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
