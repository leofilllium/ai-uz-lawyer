/**
 * Credits Page
 * Displays organization credit balance, per-action costs, daily limits, and transaction history.
 * Premium design matching the Dashboard aesthetic with proper light/dark mode support.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  getCreditBalance,
  getCreditCosts,
  getCreditTransactions,
  updateCreditLimits,
  type CreditBalance,
  type CreditCost,
  type CreditTransaction,
} from '../api/client';

const ACTION_LABELS: Record<string, { icon: string; name: string }> = {
  chat: { icon: 'CH', name: 'AI Юрист (чат)' },
  contract_gen_std: { icon: 'GS', name: 'Генерация (стандарт)' },
  contract_gen_ultra: { icon: 'GU', name: 'Генерация (ультра)' },
  contract_validator: { icon: 'CV', name: 'Проверка договора' },
  fix_contract: { icon: 'FX', name: 'Исправление договора' },
  document_validator: { icon: 'DV', name: 'Проверка документа' },
};

export default function Credits() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [costs, setCosts] = useState<CreditCost[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'history' | 'settings'>('overview');

  // Settings state
  const [dailyLimitPerUser, setDailyLimitPerUser] = useState<string>('');
  const [dailyLimitTotal, setDailyLimitTotal] = useState<string>('');
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitMsg, setLimitMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, c, t] = await Promise.all([
        getCreditBalance(),
        getCreditCosts(),
        getCreditTransactions(50),
      ]);
      setBalance(b);
      setCosts(c);
      setTransactions(t);
      setDailyLimitPerUser(String(b.user.daily_limit || ''));
      setDailyLimitTotal(String(b.organization.daily_limit_total || ''));
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLimits = async () => {
    setSavingLimits(true);
    setLimitMsg('');
    try {
      await updateCreditLimits(
        dailyLimitPerUser ? parseInt(dailyLimitPerUser) : null,
        dailyLimitTotal ? parseInt(dailyLimitTotal) : null,
      );
      setLimitMsg('✅ Лимиты обновлены');
      loadData();
    } catch (err: any) {
      setLimitMsg('Ошибка: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setSavingLimits(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Загрузка кредитов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <Link to="/dashboard" className="btn-team">← Вернуться</Link>
      </div>
    );
  }

  const org = balance!.organization;
  const usr = balance!.user;
  const usagePercent = org.credits_granted > 0
    ? Math.round((1 - org.credits_remaining / org.credits_granted) * 100)
    : 0;
  const dailyPercent = usr.daily_limit
    ? Math.round((usr.daily_usage / usr.daily_limit) * 100)
    : 0;

  const tabs = [
    { key: 'overview' as const, label: 'Баланс' },
    { key: 'costs' as const, label: 'Стоимости' },
    { key: 'history' as const, label: 'История' },
    ...(user?.role === 'HEAD' ? [{ key: 'settings' as const, label: 'Лимиты' }] : []),
  ];

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="credits-page">
      {/* Header */}
      <header className="inner-topbar">
        <div className="inner-topbar__left">
          <span className="inner-topbar__brand" onClick={() => navigate('/dashboard')}>LawyerAI</span>
          <span className="inner-topbar__sep" />
          <span className="inner-topbar__page">Кредиты</span>
        </div>
        <div className="inner-topbar__right">
          {user?.role === 'HEAD' && (
            <Link to="/team" className="inner-topbar__btn">Команда</Link>
          )}
          <button onClick={toggleTheme} className="inner-topbar__btn">
            {isDark ? 'Light' : 'Dark'}
          </button>
          <div className="inner-topbar__user" title={user?.name || ''}>
            <span className="inner-topbar__avatar">{userInitial}</span>
          </div>
          <button onClick={logout} className="inner-topbar__btn">Выход</button>
        </div>
      </header>

      {/* Content */}
      <main className="credits-content">
        {/* Tabs */}
        <div className="credits-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`credits-tab ${activeTab === tab.key ? 'credits-tab--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {/* Org Balance Card */}
            <div style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Баланс организации
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: org.credits_remaining > 0 ? '#3fb950' : '#f85149', lineHeight: 1.1 }}>
                {org.credits_remaining.toLocaleString()}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                из {org.credits_granted.toLocaleString()} кредитов
              </div>
              {/* Progress bar */}
              <div style={{
                marginTop: '16px',
                height: 6,
                borderRadius: 3,
                background: 'var(--color-border)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(usagePercent, 100)}%`,
                  borderRadius: 3,
                  background: usagePercent > 80 ? '#f85149' : usagePercent > 50 ? '#d29922' : '#3fb950',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                  Использовано {usagePercent}%
                </span>
                {org.period_end && (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    до {new Date(org.period_end).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
            </div>

            {/* Daily Usage Card */}
            <div style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Ваше дневное использование
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.1 }}>
                {usr.daily_usage.toLocaleString()}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {usr.daily_limit ? `из ${usr.daily_limit.toLocaleString()} лимита` : 'без лимита'}
              </div>
              {usr.daily_limit && (
                <>
                  <div style={{
                    marginTop: '16px',
                    height: 6,
                    borderRadius: 3,
                    background: 'var(--color-border)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(dailyPercent, 100)}%`,
                      borderRadius: 3,
                      background: dailyPercent > 80 ? '#f85149' : dailyPercent > 50 ? '#d29922' : '#58a6ff',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
                    Осталось: {usr.daily_remaining.toLocaleString()} сегодня
                  </div>
                </>
              )}
            </div>

            {/* Org Daily Usage Card */}
            <div style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Организация сегодня
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.1 }}>
                {org.daily_usage.toLocaleString()}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {org.daily_limit_total ? `из ${org.daily_limit_total.toLocaleString()} общего лимита` : 'без общего лимита'}
              </div>
            </div>
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && (
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '24px',
            border: '1px solid var(--glass-border)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
              Стоимость операций
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {costs.map(cost => {
                const label = ACTION_LABELS[cost.action_type];
                return (
                  <div key={cost.action_type} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    transition: 'background 0.15s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-hover, rgba(128,128,128,0.06))')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{label?.icon || '⚡'}</span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {label?.name || cost.action}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      background: 'rgba(196, 30, 58, 0.08)',
                      border: '1px solid rgba(196, 30, 58, 0.15)',
                      padding: '4px 12px',
                      borderRadius: '100px',
                    }}>
                      {cost.credits.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
            <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-tertiary)', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              Кредиты списываются только после успешного выполнения операции. При ошибке кредиты не расходуются.
            </p>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '24px',
            border: '1px solid var(--glass-border)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
              История транзакций
            </h3>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-tertiary)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>📭</div>
                <p style={{ fontSize: '14px' }}>Транзакций пока нет</p>
              </div>
            ) : (
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {transactions.map((tx, i) => {
                  const label = ACTION_LABELS[tx.action_type];
                  return (
                    <div key={tx.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: i < transactions.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>{label?.icon || '⚡'}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tx.description}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                            {new Date(tx.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#f85149',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginLeft: '12px',
                      }}>
                        −{tx.credits_used}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab (HEAD only) */}
        {activeTab === 'settings' && user?.role === 'HEAD' && (
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '24px',
            border: '1px solid var(--glass-border)',
            maxWidth: 460,
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
              Настройка дневных лимитов
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Лимит на пользователя (в день)
                </label>
                <input
                  type="number"
                  value={dailyLimitPerUser}
                  onChange={e => setDailyLimitPerUser(e.target.value)}
                  placeholder="5000"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-background, var(--color-bg))',
                    color: 'var(--color-text-primary)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Общий лимит организации (в день)
                </label>
                <input
                  type="number"
                  value={dailyLimitTotal}
                  onChange={e => setDailyLimitTotal(e.target.value)}
                  placeholder="Без ограничений"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-background, var(--color-bg))',
                    color: 'var(--color-text-primary)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                />
              </div>
              <button
                onClick={handleSaveLimits}
                disabled={savingLimits}
                className="btn-primary"
                style={{
                  marginTop: '4px',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: 'none',
                  background: 'var(--gradient-primary, var(--color-primary))',
                  color: '#fff',
                  cursor: savingLimits ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  opacity: savingLimits ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                  width: '100%',
                }}
              >
                {savingLimits ? 'Сохранение...' : 'Сохранить лимиты'}
              </button>
              {limitMsg && (
                <p style={{ fontSize: '13px', color: limitMsg.startsWith('✅') ? '#3fb950' : '#f85149', margin: 0 }}>
                  {limitMsg}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
