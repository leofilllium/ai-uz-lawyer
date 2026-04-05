/**
 * Dashboard — Editorial legal platform interface
 * Anti-slop: asymmetric grid, mono accents, no glassmorphism, no sparklines
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getHistory, deleteHistoryItem, getCreditBalance, type HistoryItem, type CreditBalance } from '../api/client';

/* ── Card data ───────────────────────────────────── */
const TOOLS = [
  {
    key: 'lawyer',
    to: '/lawyer',
    title: 'AI Юрист',
    desc: 'Консультации по законодательству Узбекистана с анализом кодексов',
    tag: 'RAG + Claude',
  },
  {
    key: 'validator',
    to: '/validator',
    title: 'Проверка договора',
    desc: 'Анализ договоров на соответствие законодательству',
    tag: 'Gemini Flash',
  },
  {
    key: 'generator',
    to: '/generator',
    title: 'Генератор договоров',
    desc: 'Создание договоров на основе шаблонов и требований',
    tag: 'Шаблоны .docx',
  },
  {
    key: 'doc-validator',
    to: '/document-validator',
    title: 'Проверка документов',
    desc: 'Комплексный 11-блоковый анализ юридических документов',
    tag: '11 блоков',
  },
];

const LINKS = [
  { key: 'projects', to: '/project-board', label: 'Задачи и Проекты' },
  { key: 'calendar', to: '/calendar', label: 'Календарь' },
  { key: 'history', to: '/history', label: 'История' },
];

const TYPE_LABELS: Record<string, string> = {
  chat: 'Консультация',
  validation: 'Проверка',
  document_validation: 'Анализ',
  generation: 'Генерация',
};

/* ── Dashboard Component ─────────────────────────── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);

  useEffect(() => {
    loadHistory();
    getCreditBalance().then(setCreditBalance).catch(() => {});
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data.slice(0, 6));
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

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="dash">
      {/* ── Topbar ── */}
      <header className="dash-topbar">
        <div className="dash-topbar__left">
          <span className="dash-wordmark">LawyerAI</span>
          <span className="dash-topbar__sep" />
          <span className="dash-topbar__env">Uzbekistan Legal Platform</span>
        </div>
        <div className="dash-topbar__right">
          {user?.role === 'HEAD' && (
            <Link to="/team" className="dash-topbar__link">Команда</Link>
          )}
          <Link to="/credits" className="dash-topbar__link dash-topbar__link--mono">
            {creditBalance ? creditBalance.organization.credits_remaining.toLocaleString() : '—'} cr
          </Link>
          <button
            onClick={toggleTheme}
            className="dash-topbar__btn"
            title={isDark ? 'Светлая тема' : 'Тёмная тема'}
          >
            {isDark ? 'Light' : 'Dark'}
          </button>
          <div className="dash-topbar__user" title={user?.name || ''}>
            <span className="dash-topbar__avatar">{userInitial}</span>
            <span className="dash-topbar__name">{user?.name}</span>
          </div>
          <button onClick={logout} className="dash-topbar__btn dash-topbar__btn--logout">
            Выход
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="dash-hero">
        <div className="dash-hero__content">
          <span className="dash-hero__label">Правовой помощник</span>
          <h1 className="dash-hero__title">Юридическая<br/>платформа</h1>
          <p className="dash-hero__subtitle">Инструменты для работы с законодательством Республики Узбекистан</p>
          <Link to="/lawyer" className="dash-hero__cta">
            Начать консультацию
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
        <div className="dash-hero__aside">
          <div className="dash-hero__stat-block">
            <span className="dash-hero__stat-number">
              {creditBalance ? creditBalance.organization.credits_remaining.toLocaleString() : '—'}
            </span>
            <span className="dash-hero__stat-label">кредитов доступно</span>
          </div>
        </div>
      </section>

      {/* ── Tools grid ── */}
      <section className="dash-tools">
        <div className="dash-section-head">
          <span className="dash-section-head__idx">01</span>
          <h2 className="dash-section-head__title">Инструменты</h2>
        </div>
        <div className="dash-tools__grid">
          {TOOLS.map((tool, idx) => (
            <Link
              key={tool.key}
              to={tool.to}
              className={`dash-tool dash-tool--${tool.key}`}
            >
              <span className="dash-tool__num">{String(idx + 1).padStart(2, '0')}</span>
              <h3 className="dash-tool__title">{tool.title}</h3>
              <p className="dash-tool__desc">{tool.desc}</p>
              <span className="dash-tool__tag">{tool.tag}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Quick links ── */}
      <section className="dash-links">
        <div className="dash-section-head">
          <span className="dash-section-head__idx">02</span>
          <h2 className="dash-section-head__title">Навигация</h2>
        </div>
        <div className="dash-links__row">
          {LINKS.map((link) => (
            <Link key={link.key} to={link.to} className="dash-link-card">
              <span className="dash-link-card__label">{link.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent activity ── */}
      <section className="dash-activity">
        <div className="dash-section-head">
          <span className="dash-section-head__idx">03</span>
          <h2 className="dash-section-head__title">Недавнее</h2>
          {history.length > 0 && (
            <Link to="/history" className="dash-section-head__link">Вся история</Link>
          )}
        </div>

        {loading ? (
          <div className="dash-activity__skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="dash-skel-row" style={{ animationDelay: `${i * 120}ms` }}>
                <div className="dash-skel-row__bar" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="dash-activity__empty">
            <p>Начните с одной из функций выше — история появится здесь</p>
          </div>
        ) : (
          <div className="dash-activity__list">
            {history.map((item, idx) => (
              <div
                key={`${item.type}-${item.id}`}
                className="dash-activity__item"
                onClick={() => handleItemClick(item)}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className="dash-activity__type">{TYPE_LABELS[item.type] || item.type}</span>
                <span className="dash-activity__title">{item.title}</span>
                <span className="dash-activity__date">
                  {new Date(item.created_at || '').toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <button
                  className="dash-activity__del"
                  onClick={(e) => handleDelete(e, item)}
                  title="Удалить"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
