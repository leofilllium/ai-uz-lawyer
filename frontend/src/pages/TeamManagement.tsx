/**
 * TeamManagement — HEAD-only page for managing organization members.
 * List all users, approve pending ones, and change roles (SENIOR / EMPLOYEE).
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMe,
  getOrgUsers,
  approveUser,
  updateUserRole,
  type User,
} from '../api/client';

const ROLE_LABELS: Record<string, string> = {
  HEAD: 'Руководитель',
  SENIOR: 'Старший юрист',
  EMPLOYEE: 'Юрист',
};

const ROLE_COLORS: Record<string, string> = {
  HEAD: '#a371f7',
  SENIOR: '#58a6ff',
  EMPLOYEE: '#8b949e',
};

export default function TeamManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [me, users] = await Promise.all([getMe(), getOrgUsers()]);
      setUser(me);
      setMembers(users);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (userId: number) => {
    try {
      await approveUser(userId);
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, is_approved: true } : m))
      );
    } catch {
      alert('Ошибка при одобрении пользователя');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole as User['role'] } : m))
      );
    } catch {
      alert('Ошибка при изменении роли');
    }
  };

  const handleLogout = () => {
    import('../api/client').then((m) => m.logout());
    navigate('/login');
  };

  // Redirect non-HEAD users
  useEffect(() => {
    if (!loading && user && user.role !== 'HEAD') {
      navigate('/dashboard');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="team-page" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', minHeight: '100vh' }}>
        <div style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>Загрузка...</div>
      </div>
    );
  }

  const pendingMembers = members.filter((m) => !m.is_approved && m.id !== user?.id);
  const activeMembers = members.filter((m) => m.is_approved);

  return (
    <div className="team-page">
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
              <span className="dash-header__subtitle">Управление командой</span>
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

      {/* Content */}
      <div className="team-content">
        <div className="team-content__inner">
          {/* Back + title */}
          <div className="team-header-row">
            <button className="team-back-btn" onClick={() => navigate('/dashboard')}>
              ← Панель
            </button>
            <h2 className="team-page-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Команда · {activeMembers.length} участник{activeMembers.length !== 1 ? (activeMembers.length < 5 ? 'а' : 'ов') : ''}
            </h2>
          </div>

          {/* Pending approvals */}
          {pendingMembers.length > 0 && (
            <div className="team-section">
              <div className="team-section__header">
                <span className="team-section__dot" style={{ background: '#d29922' }} />
                <span>Ожидают одобрения</span>
                <span className="team-section__count">{pendingMembers.length}</span>
              </div>
              <div className="team-list">
                {pendingMembers.map((m) => (
                  <div key={m.id} className="team-card team-card--pending">
                    <div className="team-card__avatar">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="team-card__info">
                      <div className="team-card__name">{m.name}</div>
                      <div className="team-card__email">{m.email}</div>
                    </div>
                    <button className="team-card__approve-btn" onClick={() => handleApprove(m.id)}>
                      ✓ Одобрить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active members */}
          <div className="team-section">
            <div className="team-section__header">
              <span className="team-section__dot" style={{ background: '#3fb950' }} />
              <span>Активные участники</span>
              <span className="team-section__count">{activeMembers.length}</span>
            </div>
            <div className="team-list">
              {activeMembers.map((m) => (
                <div key={m.id} className="team-card">
                  <div className="team-card__avatar" style={{
                    background: m.id === user?.id
                      ? 'var(--gradient-primary)'
                      : `linear-gradient(135deg, ${ROLE_COLORS[m.role || 'EMPLOYEE']}44, ${ROLE_COLORS[m.role || 'EMPLOYEE']}22)`
                  }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="team-card__info">
                    <div className="team-card__name">
                      {m.name}
                      {m.id === user?.id && <span className="team-card__you">вы</span>}
                    </div>
                    <div className="team-card__email">{m.email}</div>
                  </div>
                  <div className="team-card__role">
                    <span
                      className="team-card__role-badge"
                      style={{
                        background: `${ROLE_COLORS[m.role || 'EMPLOYEE']}18`,
                        color: ROLE_COLORS[m.role || 'EMPLOYEE'],
                        borderColor: `${ROLE_COLORS[m.role || 'EMPLOYEE']}30`,
                      }}
                    >
                      {ROLE_LABELS[m.role || 'EMPLOYEE'] || m.role}
                    </span>
                  </div>
                  {m.id !== user?.id && m.role !== 'HEAD' && (
                    <div className="team-card__actions">
                      <select
                        className="team-card__role-select"
                        value={m.role || 'EMPLOYEE'}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      >
                        <option value="EMPLOYEE">Юрист</option>
                        <option value="SENIOR">Старший юрист</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {activeMembers.length === 0 && (
            <div className="team-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p>В вашей организации пока нет участников</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
