/**
 * Dashboard Page
 * Home page with navigation to main features and recent history.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getHistory, type HistoryItem } from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>⚖️ AI Юрист</h1>
          <span className="subtitle">Правовой помощник Узбекистана</span>
        </div>
        <div className="header-right">
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

          <Link to="/lawyer?mode=smalltalk" className="feature-card smalltalk">
            <div className="feature-icon">🗣️</div>
            <h2>Просто поболтать</h2>
            <p>Неформальное общение и поддержка в любых вопросах</p>
          </Link>

          <Link to="/history" className="feature-card history">
            <div className="feature-icon">📚</div>
            <h2>История</h2>
            <p>Все ваши консультации, проверки и договоры</p>
          </Link>
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
                <li key={`${item.type}-${item.id}`} className="history-item">
                  <span className="history-icon">{item.icon}</span>
                  <div className="history-content">
                    <span className="history-title">{item.title}</span>
                    <span className="history-date">
                      {new Date(item.created_at || '').toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
