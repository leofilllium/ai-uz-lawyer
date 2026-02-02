/**
 * Dashboard Page
 * Home page with navigation to main features and recent history.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getHistory, deleteHistoryItem, type HistoryItem } from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data.slice(0, 5)); // Show last 5 items
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
      case 'document_validation':
        navigate(`/document-validator/${item.id}`);
        break;
      case 'generation':
        navigate(`/generator?id=${item.id}`);
        break;
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    if (!confirm('Удалить эту запись?')) return;
    
    try {
      await deleteHistoryItem(item.type, item.id);
      setHistory((prev) => prev.filter((i) => !(i.type === item.type && i.id === item.id)));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>⚖️ AI Юрист</h1>
          <span className="subtitle">Правовой помощник Узбекистана</span>
        </div>
        <div className="header-right">
          <button onClick={toggleTheme} className="btn-theme-toggle" title={isDark ? 'Светлая тема' : 'Тёмная тема'}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <span className="user-name">👤 {user?.name}</span>
          <button onClick={logout} className="btn-logout">Выход</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="features-grid">
          <Link to="/lawyer" className="feature-card lawyer">
            <div className="feature-icon">💬</div>
            <h2>AI Юрист</h2>
            <p>Консультации по законодательству Узбекистана с анализом кодексов</p>
          </Link>

          <Link to="/validator" className="feature-card validator">
            <div className="feature-icon">✅</div>
            <h2>Проверка договора</h2>
            <p>Анализ договоров на соответствие законодательству</p>
          </Link>

          <Link to="/generator" className="feature-card generator">
            <div className="feature-icon">📝</div>
            <h2>Генератор договоров</h2>
            <p>Создание договоров на основе шаблонов и требований</p>
          </Link>

          <Link to="/document-validator" className="feature-card doc-validator">
            <div className="feature-icon">📄</div>
            <h2>Проверка документов</h2>
            <p>Комплексный 11-блоковый анализ юридических документов</p>
          </Link>

          {/* <Link to="/lawyer?mode=smalltalk" className="feature-card smalltalk">
            <div className="feature-icon">🗣️</div>
            <h2>Просто поболтать</h2>
            <p>Неформальное общение и поддержка в любых вопросах</p>
          </Link> */}

          <Link to="/history" className="feature-card history">
            <div className="feature-icon">📚</div>
            <h2>История</h2>
            <p>Все ваши консультации, проверки и договоры</p>
          </Link>

          {/* <Link to="/admin" className="feature-card admin">
            <div className="feature-icon">⚙️</div>
            <h2>Админ панель</h2>
            <p>Управление базой законов и документов</p>
          </Link> */}
        </section>

        <section className="recent-history">
          <h2>📋 Недавняя активность</h2>
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p>Пока нет активности. Начните с одной из функций выше!</p>
            </div>
          ) : (
            <ul className="history-list">
              {history.map((item) => (
                <li 
                  key={`${item.type}-${item.id}`} 
                  className="history-item clickable"
                  onClick={() => handleItemClick(item)}
                >
                  <span className="history-icon">{item.icon}</span>
                  <div className="history-content">
                    <span className="history-title">{item.title}</span>
                    <span className="history-date">
                      {new Date(item.created_at || '').toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <button 
                    className="btn-delete-small" 
                    onClick={(e) => handleDelete(e, item)}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
