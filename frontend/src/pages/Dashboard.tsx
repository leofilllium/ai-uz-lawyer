/**
 * Dashboard Page — Premium Legal Tech Interface
 * Bespoke design with glassmorphism, bento grid, micro-animations, and depth.
 */

import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getHistory, deleteHistoryItem, getCreditBalance, type HistoryItem, type CreditBalance } from '../api/client';

/* ── SVG Icon Components ─────────────────────────── */
const Icons = {
  scales: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M4 7h16" />
      <path d="M4 7l3 8h0a4 4 0 0 0 3.5-2 4 4 0 0 0 .5-2L7 7" />
      <path d="M20 7l-3 8h0a4 4 0 0 1-3.5-2 4 4 0 0 1-.5-2l4-4" />
      <circle cx="12" cy="3" r="1" />
    </svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5.25-3.5 8.75-8 10-4.5-1.25-8-4.75-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  document: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  scan: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="8" x2="13" y2="8" />
      <line x1="7" y1="16" x2="15" y2="16" />
    </svg>
  ),
  archive: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v4H4z" />
      <path d="M4 8v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <line x1="10" y1="13" x2="14" y2="13" />
    </svg>
  ),
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  activity: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  chevronRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

/* ── Animated Counter ─────────────────────────────── */
function AnimatedCount({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            start = Math.floor(eased * target);
            setCount(start);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref} className="stat-number">{count.toLocaleString('ru-RU')}</span>;
}

/* ── Mini Sparkline ──────────────────────────────── */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="sparkline" viewBox={`0 0 ${w} ${h}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

/* ── Card data ───────────────────────────────────── */
const CARD_META = [
  {
    key: 'projects',
    to: '/project-board',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    title: 'Задачи и Проекты',
    desc: 'Канбан-доска для управления задачами фирмы',
    stat: 12, // Example stat, could be fetched
    statLabel: 'активных задач',
    sparkData: [5, 8, 6, 9, 12, 10, 14, 11, 15, 12],
    primary: true,
  },
  {
    key: 'lawyer',
    to: '/lawyer',
    icon: Icons.scales,
    title: 'AI Юрист',
    desc: 'Консультации по законодательству Узбекистана с анализом кодексов',
    stat: 1247,
    statLabel: 'консультаций',
    sparkData: [3, 7, 5, 12, 9, 14, 11, 18, 15, 20],
    primary: true,
  },
  {
    key: 'validator',
    to: '/validator',
    icon: Icons.shield,
    title: 'Проверка договора',
    desc: 'Анализ договоров на соответствие законодательству',
    stat: 389,
    statLabel: 'проверок',
    sparkData: [2, 4, 3, 6, 5, 8, 7, 9, 11, 10],
  },
  {
    key: 'generator',
    to: '/generator',
    icon: Icons.document,
    title: 'Генератор договоров',
    desc: 'Создание договоров на основе шаблонов и требований',
    stat: 156,
    statLabel: 'документов',
    sparkData: [1, 3, 2, 5, 4, 6, 5, 7, 8, 9],
  },
  {
    key: 'doc-validator',
    to: '/document-validator',
    icon: Icons.scan,
    title: 'Проверка документов',
    desc: 'Комплексный 11-блоковый анализ юридических документов',
    stat: 78,
    statLabel: 'анализов',
    sparkData: [0, 1, 2, 1, 3, 2, 4, 3, 5, 6],
  },
  {
    key: 'calendar',
    to: '/calendar',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Календарь',
    desc: 'Дедлайны задач и события организации',
    stat: 0,
    statLabel: 'событий',
    sparkData: [1, 2, 3, 2, 4, 3, 5, 4, 6, 5],
    half: true,
  },
  {
    key: 'history',
    to: '/history',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'История',
    desc: 'Журнал всех консультаций и проверок',
    stat: 0,
    statLabel: 'записей',
    sparkData: [2, 4, 3, 5, 7, 6, 8, 9, 11, 10],
    half: true,
  },
];

const ACCENT_COLORS: Record<string, string> = {
  projects: '#8b5cf6', // Violet
  lawyer: 'var(--color-primary)',
  validator: 'var(--color-success)',
  generator: 'var(--color-warning)',
  'doc-validator': '#6366f1',
  calendar: '#0ea5e9',
  history: '#f59e0b',
};

/* ── Dashboard Component ─────────────────────────── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fabRipple, setFabRipple] = useState(false);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // History
  useEffect(() => {
    loadHistory();
    getCreditBalance().then(setCreditBalance).catch(() => {});
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data.slice(0, 5));
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

  const handleFabClick = () => {
    setFabRipple(true);
    setTimeout(() => {
      setFabRipple(false);
      navigate('/lawyer');
    }, 400);
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const timeStr = currentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="dashboard-premium">
      {/* Background watermark */}
      <div className="dashboard-watermark" aria-hidden="true" />

      {/* Sidebar accent */}
      <div className="sidebar-accent" aria-hidden="true" />

      {/* Header */}
      <header className="dash-header">
        <div className="dash-header__left">
          <div className="dash-header__brand">
            <div className="brand-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <path d="M4 7h16" />
                <path d="M4 7l3 8a4 4 0 0 0 4-4L7 7" />
                <path d="M20 7l-3 8a4 4 0 0 1-4-4l4-4" />
                <circle cx="12" cy="3" r="1" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="dash-header__title">Юридическая платформа</h1>
              <span className="dash-header__subtitle">Правовой помощник Узбекистана</span>
            </div>
          </div>
          <div className="dash-header__meta">
            <span className="system-status">
              <span className="status-dot" />
              Все системы работают
            </span>
            <span className="header-divider" />
            <span className="header-time">
              {Icons.clock}
              <span>{timeStr}</span>
              <span className="header-date">{dateStr}</span>
            </span>
          </div>
        </div>
        <div className="dash-header__right">
          {user?.role === 'HEAD' && (
            <Link to="/team" className="btn-team">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Команда</span>
            </Link>
          )}
          <Link to="/credits" className="btn-team" title="Кредиты">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span>{creditBalance ? creditBalance.organization.credits_remaining.toLocaleString() : '—'}</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="btn-icon"
            title={isDark ? 'Светлая тема' : 'Тёмная тема'}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? Icons.sun : Icons.moon}
          </button>
          <div className="user-badge" title={user?.name || ''}>
            <span className="user-initial">{userInitial}</span>
            <span className="user-badge__name">{user?.name}</span>
          </div>
          <button onClick={logout} className="btn-logout-premium">
            {Icons.logout}
            <span>Выход</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="dash-content">
        {/* Gradient divider */}
        <div className="section-divider" aria-hidden="true" />

        {/* Bento grid */}
        <section className="bento-grid">
          {CARD_META.map((card, idx) => (
            <Link
              key={card.key}
              to={card.to}
              className={`bento-card bento-card--${card.key}${card.primary ? ' bento-card--primary' : ''}${card.half ? ' bento-card--half' : ''}`}
              style={{
                '--card-accent': ACCENT_COLORS[card.key],
                '--card-index': idx,
                animationDelay: `${idx * 80}ms`,
              } as React.CSSProperties}
            >
              <div className="bento-card__inner">
                <div className="bento-card__header">
                  <div className="bento-card__icon" aria-hidden="true">
                    {card.icon}
                  </div>
                  {card.sparkData.length > 0 && (
                    <MiniSparkline data={card.sparkData} color={ACCENT_COLORS[card.key]} />
                  )}
                </div>
                <h2 className="bento-card__title">{card.title}</h2>
                <p className="bento-card__desc">{card.desc}</p>
                {card.stat > 0 && (
                  <div className="bento-card__stats">
                    <AnimatedCount target={card.stat} />
                    <span className="stat-label">{card.statLabel}</span>
                  </div>
                )}
                <div className="bento-card__arrow">
                  {Icons.chevronRight}
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Activity section */}
        <section className="activity-section">
          <div className="activity-header">
            <div className="activity-header__left">
              {Icons.activity}
              <h2>Недавняя активность</h2>
            </div>
            {history.length > 0 && (
              <Link to="/history" className="activity-view-all">
                Вся история {Icons.chevronRight}
              </Link>
            )}
          </div>

          {loading ? (
            <div className="skeleton-timeline">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-item" style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="skeleton-dot" />
                  <div className="skeleton-content">
                    <div className="skeleton-line skeleton-line--title" />
                    <div className="skeleton-line skeleton-line--date" />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="activity-empty">
              <div className="activity-empty__icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                  <path d="M12 2l8 4v6c0 5.25-3.5 8.75-8 10-4.5-1.25-8-4.75-8-10V6l8-4z" />
                  <line x1="12" y1="8" x2="12" y2="13" />
                  <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                </svg>
              </div>
              <p className="activity-empty__text">Начните с одной из функций выше</p>
              <p className="activity-empty__hint">Ваша история консультаций появится здесь</p>
            </div>
          ) : (
            <ul className="timeline-list">
              {history.map((item, idx) => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="timeline-item"
                  onClick={() => handleItemClick(item)}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-icon">{item.icon}</span>
                    <div className="timeline-info">
                      <span className="timeline-title">{item.title}</span>
                      <span className="timeline-date">
                        {new Date(item.created_at || '').toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    className="timeline-delete"
                    onClick={(e) => handleDelete(e, item)}
                    title="Удалить"
                    aria-label="Удалить запись"
                  >
                    {Icons.trash}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* FAB */}
      <button
        className={`fab ${fabRipple ? 'fab--ripple' : ''}`}
        onClick={handleFabClick}
        title="Новая консультация"
        aria-label="Новая консультация"
      >
        {Icons.plus}
        <span className="fab__label">Новая консультация</span>
      </button>
    </div>
  );
}
