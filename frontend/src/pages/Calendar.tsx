/**
 * Calendar — Monthly calendar view showing task deadlines + organization events.
 * Supports creating/deleting events and navigating months.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  getTasks,
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  type Task,
  type CalendarEvent,
} from '../api/client';

/* ── Helpers ── */
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0=Mon … 6=Sun (ISO)
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface DayItem {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  events: CalendarEvent[];
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function Calendar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDatetime, setNewDatetime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Selected day detail
  const [selectedDay, setSelectedDay] = useState<DayItem | null>(null);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, e] = await Promise.all([
        getTasks(),
        getCalendarEvents(currentYear, currentMonth + 1),
      ]);
      setTasks(t);
      setEvents(e);
    } catch {
      console.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Build calendar grid ── */
  const buildCalendar = (): DayItem[][] => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
    const prevMonthDays = getDaysInMonth(
      currentMonth === 0 ? currentYear - 1 : currentYear,
      currentMonth === 0 ? 11 : currentMonth - 1
    );

    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    const allDays: DayItem[] = [];

    // Previous month tail
    for (let i = firstDay - 1; i >= 0; i--) {
      allDays.push({
        date: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        tasks: [],
        events: [],
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${currentYear}-${currentMonth}-${d}`;
      const dayTasks = tasks.filter((t) => {
        if (!t.deadline) return false;
        const dd = new Date(t.deadline);
        return dd.getFullYear() === currentYear && dd.getMonth() === currentMonth && dd.getDate() === d;
      });
      const dayEvents = events.filter((e) => {
        const dd = new Date(e.event_datetime);
        return dd.getFullYear() === currentYear && dd.getMonth() === currentMonth && dd.getDate() === d;
      });

      allDays.push({
        date: d,
        isCurrentMonth: true,
        isToday: key === todayStr,
        tasks: dayTasks,
        events: dayEvents,
      });
    }

    // Next month head (fill to 42 = 6 rows)
    const remaining = 42 - allDays.length;
    for (let i = 1; i <= remaining; i++) {
      allDays.push({ date: i, isCurrentMonth: false, isToday: false, tasks: [], events: [] });
    }

    // Split into weeks
    const weeks: DayItem[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }
    return weeks;
  };

  const weeks = buildCalendar();

  /* ── Navigation ── */
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const goToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(null);
  };

  /* ── Event CRUD ── */
  const openCreateModal = (day?: DayItem) => {
    const dateStr = day && day.isCurrentMonth
      ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}T12:00`
      : '';
    setNewDatetime(dateStr);
    setNewTitle('');
    setNewDesc('');
    setShowModal(true);
  };

  const handleCreateEvent = async () => {
    if (!newTitle.trim() || !newDatetime) return;
    setSubmitting(true);
    try {
      await createCalendarEvent({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        event_datetime: new Date(newDatetime).toISOString(),
      });
      setShowModal(false);
      await loadData();
    } catch {
      alert('Ошибка при создании события');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Удалить это событие?')) return;
    try {
      await deleteCalendarEvent(eventId);
      setSelectedDay(null);
      await loadData();
    } catch {
      alert('Ошибка при удалении события');
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading && tasks.length === 0) {
    return (
      <div className="cal-page" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <div className="spinner">⚖️</div>
      </div>
    );
  }

  return (
    <div className="cal-page">
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
              <h1 className="dash-header__title" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                AI Юрист
              </h1>
              <span className="dash-header__subtitle">Календарь</span>
            </div>
          </div>
          <div className="dash-header__meta">
            <span className="system-status">
              <span className="status-dot" />
              Все системы работают
            </span>
            <span className="header-divider" />
            <span className="header-time">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="header-date">
                {time.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </span>
            </span>
          </div>
        </div>
        <div className="dash-header__right">
          <button onClick={toggleTheme} className="btn-icon" title={isDark ? 'Светлая тема' : 'Тёмная тема'}>
            {isDark ? '☀️' : '🌙'}
          </button>
          {user && (
            <div className="user-badge" title={user.name || ''}>
              <span className="user-initial">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
              <span className="user-badge__name">{user.name}</span>
            </div>
          )}
          <button onClick={handleLogout} className="btn-logout-premium" title="Выйти">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Выход</span>
          </button>
        </div>
        <div className="header-underline" aria-hidden="true" />
      </header>

      {/* Calendar Content */}
      <div className="cal-content">
        {/* Calendar top bar */}
        <div className="cal-topbar">
          <button className="btn btn-secondary" style={{ padding: '8px 16px', height: 'auto', fontSize: '13px' }} onClick={() => navigate('/dashboard')}>
            ← Главная
          </button>
          <div className="cal-nav">
            <button className="cal-nav__btn" onClick={prevMonth}>&lt;</button>
            <h2 className="cal-nav__title">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button className="cal-nav__btn" onClick={nextMonth}>&gt;</button>
            <button className="cal-nav__today" onClick={goToday}>Сегодня</button>
          </div>
          <button className="btn btn-primary" style={{ padding: '8px 20px', height: 'auto', fontSize: '13px' }} onClick={() => openCreateModal()}>
            + Событие
          </button>
        </div>

        <div className="cal-body">
          {/* Calendar Grid */}
          <div className="cal-grid-wrapper">
            {/* Day headers */}
            <div className="cal-grid__header">
              {DAY_NAMES.map((d) => (
                <div key={d} className="cal-grid__day-name">{d}</div>
              ))}
            </div>

            {/* Weeks */}
            <div className="cal-grid">
              {weeks.map((week, wi) => (
                <div key={wi} className="cal-grid__week">
                  {week.map((day, di) => {
                    const hasItems = day.tasks.length > 0 || day.events.length > 0;
                    const isSelected = selectedDay?.date === day.date && selectedDay?.isCurrentMonth === day.isCurrentMonth;
                    return (
                      <div
                        key={di}
                        className={[
                          'cal-cell',
                          !day.isCurrentMonth && 'cal-cell--outside',
                          day.isToday && 'cal-cell--today',
                          isSelected && 'cal-cell--selected',
                        ].filter(Boolean).join(' ')}
                        onClick={() => day.isCurrentMonth && setSelectedDay(day)}
                        onDoubleClick={() => day.isCurrentMonth && openCreateModal(day)}
                      >
                        <span className="cal-cell__date">{day.date}</span>
                        {hasItems && day.isCurrentMonth && (
                          <div className="cal-cell__dots">
                            {day.tasks.length > 0 && <span className="cal-dot cal-dot--task" title={`${day.tasks.length} задач(и)`} />}
                            {day.events.length > 0 && <span className="cal-dot cal-dot--event" title={`${day.events.length} событий`} />}
                          </div>
                        )}
                        {/* Show up to 2 items inline */}
                        {day.isCurrentMonth && (
                          <div className="cal-cell__items">
                            {day.tasks.slice(0, 1).map((t) => (
                              <div key={`t-${t.id}`} className="cal-item cal-item--task" title={t.title}>
                                {t.title}
                              </div>
                            ))}
                            {day.events.slice(0, 1).map((e) => (
                              <div key={`e-${e.id}`} className="cal-item cal-item--event" title={e.title}>
                                {e.title}
                              </div>
                            ))}
                            {(day.tasks.length + day.events.length) > 2 && (
                              <div className="cal-item cal-item--more">
                                +{day.tasks.length + day.events.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar — selected day detail */}
          <div className="cal-sidebar">
            {selectedDay ? (
              <>
                <h3 className="cal-sidebar__title">
                  {selectedDay.date} {MONTH_NAMES[currentMonth]}
                </h3>

                {selectedDay.tasks.length > 0 && (
                  <div className="cal-sidebar__section">
                    <h4 className="cal-sidebar__label">📋 Дедлайны задач</h4>
                    {selectedDay.tasks.map((t) => (
                      <div key={t.id} className="cal-sidebar__card cal-sidebar__card--task" onClick={() => navigate(`/project-board/${t.id}`)}>
                        <div className="cal-sidebar__card-title">{t.title}</div>
                        <div className="cal-sidebar__card-meta">
                          {t.deadline && formatTime(t.deadline)} · {t.assignee_name || 'Не назначен'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDay.events.length > 0 && (
                  <div className="cal-sidebar__section">
                    <h4 className="cal-sidebar__label">📅 События</h4>
                    {selectedDay.events.map((e) => (
                      <div key={e.id} className="cal-sidebar__card cal-sidebar__card--event">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div className="cal-sidebar__card-title">{e.title}</div>
                            <div className="cal-sidebar__card-meta">
                              {formatTime(e.event_datetime)}
                              {e.creator_name && ` · ${e.creator_name}`}
                            </div>
                            {e.description && (
                              <div className="cal-sidebar__card-desc">{e.description}</div>
                            )}
                          </div>
                          <button
                            className="cal-sidebar__delete"
                            onClick={() => handleDeleteEvent(e.id)}
                            title="Удалить"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDay.tasks.length === 0 && selectedDay.events.length === 0 && (
                  <p className="cal-sidebar__empty">Нет событий на этот день</p>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '16px', height: '40px', fontSize: '13px' }}
                  onClick={() => openCreateModal(selectedDay)}
                >
                  + Добавить событие
                </button>
              </>
            ) : (
              <div className="cal-sidebar__placeholder">
                <span style={{ fontSize: '2.5rem' }}>📅</span>
                <p>Выберите день, чтобы увидеть детали</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="cal-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="cal-modal__title">Новое событие</h3>
            <div className="form-group">
              <label className="form-label">Название *</label>
              <input
                className="form-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Название события..."
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea
                className="form-input"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Описание (необязательно)..."
                rows={3}
                style={{ height: 'auto', minHeight: '80px', padding: '12px 14px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Дата и время *</label>
              <input
                className="form-input"
                type="datetime-local"
                value={newDatetime}
                onChange={(e) => setNewDatetime(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                style={{ height: '40px', padding: '0 20px', fontSize: '13px' }}
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
              <button
                className="btn btn-primary"
                style={{ height: '40px', padding: '0 20px', fontSize: '13px' }}
                disabled={submitting || !newTitle.trim() || !newDatetime}
                onClick={handleCreateEvent}
              >
                {submitting ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
