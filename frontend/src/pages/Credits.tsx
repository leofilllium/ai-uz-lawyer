/**
 * Credits Page
 * Displays organization credit balance, per-action costs, daily limits, and transaction history.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getCreditBalance,
  getCreditCosts,
  getCreditTransactions,
  updateCreditLimits,
  type CreditBalance,
  type CreditCost,
  type CreditTransaction,
} from '../api/client';

const ACTION_ICONS: Record<string, string> = {
  chat: '💬',
  contract_gen_std: '📄',
  contract_gen_ultra: '🔥',
  contract_validator: '✅',
  fix_contract: '🔧',
  document_validator: '📋',
};

export default function Credits() {
  const { user } = useAuth();
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
      setLimitMsg('❌ ' + (err.message || 'Ошибка'));
    } finally {
      setSavingLimits(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner">⚡</div>
        <p>Загрузка кредитов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Ошибка</h2>
        <p style={{ color: 'var(--color-error)' }}>{error}</p>
        <Link to="/dashboard" style={{ color: 'var(--color-accent)' }}>← Вернуться</Link>
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

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-logo">⚖️ AI Юрист</Link>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-link">📊 Дашборд</Link>
          <Link to="/lawyer" className="sidebar-link">💬 AI Юрист</Link>
          <Link to="/validator" className="sidebar-link">✅ Проверка договора</Link>
          <Link to="/document-validator" className="sidebar-link">📋 Проверка документа</Link>
          <Link to="/generator" className="sidebar-link">📝 Генератор</Link>
          <Link to="/credits" className="sidebar-link active">⚡ Кредиты</Link>
          <Link to="/history" className="sidebar-link">📁 История</Link>
          <Link to="/project-board" className="sidebar-link">📋 Задачи</Link>
          <Link to="/calendar" className="sidebar-link">📅 Календарь</Link>
          {user?.role === 'HEAD' && <Link to="/team" className="sidebar-link">👥 Команда</Link>}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ padding: '1.5rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚡ Кредиты</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Баланс, стоимости и история использования
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {(['overview', 'costs', 'history', ...(user?.role === 'HEAD' ? ['settings'] : [])] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: activeTab === tab ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: activeTab === tab ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: activeTab === tab ? '#fff' : 'var(--color-text)',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: '0.9rem'
                }}
              >
                {{overview: '📊 Баланс', costs: '💰 Стоимости', history: '📜 История', settings: '⚙️ Лимиты'}[tab]}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {/* Org Balance Card */}
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Баланс организации
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: org.credits_remaining > 0 ? 'var(--color-success, #22c55e)' : 'var(--color-error, #ef4444)' }}>
                  {org.credits_remaining.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  из {org.credits_granted.toLocaleString()} кредитов
                </div>
                {/* Progress bar */}
                <div style={{
                  marginTop: '0.75rem',
                  height: 8,
                  borderRadius: 4,
                  background: 'var(--color-border)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(usagePercent, 100)}%`,
                    borderRadius: 4,
                    background: usagePercent > 80 ? '#ef4444' : usagePercent > 50 ? '#f59e0b' : '#22c55e',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Использовано {usagePercent}%
                </div>
                {org.period_end && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Истекает: {new Date(org.period_end).toLocaleDateString('ru-RU')}
                  </div>
                )}
              </div>

              {/* Daily Usage Card */}
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Ваше дневное использование
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                  {usr.daily_usage.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {usr.daily_limit ? `из ${usr.daily_limit.toLocaleString()} лимита` : 'без лимита'}
                </div>
                {usr.daily_limit && (
                  <>
                    <div style={{
                      marginTop: '0.75rem',
                      height: 8,
                      borderRadius: 4,
                      background: 'var(--color-border)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(dailyPercent, 100)}%`,
                        borderRadius: 4,
                        background: dailyPercent > 80 ? '#ef4444' : dailyPercent > 50 ? '#f59e0b' : '#3b82f6',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Осталось: {usr.daily_remaining.toLocaleString()} кредитов сегодня
                    </div>
                  </>
                )}
              </div>

              {/* Org Daily Usage Card */}
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Организация сегодня
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                  {org.daily_usage.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {org.daily_limit_total ? `из ${org.daily_limit_total.toLocaleString()} общего лимита` : 'без общего лимита'}
                </div>
              </div>
            </div>
          )}

          {/* Costs Tab */}
          {activeTab === 'costs' && (
            <div style={{
              background: 'var(--color-surface)',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid var(--color-border)',
            }}>
              <h3 style={{ marginBottom: '1rem' }}>💰 Стоимость операций</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Операция</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Кредиты</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map(cost => (
                    <tr key={cost.action_type} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ marginRight: '0.5rem' }}>{ACTION_ICONS[cost.action_type] || '⚡'}</span>
                        {cost.action}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                        {cost.credits.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                1 кредит = $0.001. Кредиты списываются после успешного выполнения.
              </p>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div style={{
              background: 'var(--color-surface)',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid var(--color-border)',
            }}>
              <h3 style={{ marginBottom: '1rem' }}>📜 История транзакций</h3>
              {transactions.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  Пока нет транзакций
                </p>
              ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {transactions.map(tx => (
                    <div key={tx.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                      <div>
                        <span style={{ marginRight: '0.5rem' }}>{ACTION_ICONS[tx.action_type] || '⚡'}</span>
                        <span>{tx.description}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          {new Date(tx.created_at).toLocaleString('ru-RU')}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: '#ef4444', whiteSpace: 'nowrap' }}>
                        -{tx.credits_used}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab (HEAD only) */}
          {activeTab === 'settings' && user?.role === 'HEAD' && (
            <div style={{
              background: 'var(--color-surface)',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid var(--color-border)',
            }}>
              <h3 style={{ marginBottom: '1rem' }}>⚙️ Настройка лимитов</h3>
              <div style={{ display: 'grid', gap: '1rem', maxWidth: 400 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>
                    Дневной лимит на пользователя
                  </label>
                  <input
                    type="number"
                    value={dailyLimitPerUser}
                    onChange={e => setDailyLimitPerUser(e.target.value)}
                    placeholder="5000"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>
                    Общий дневной лимит организации
                  </label>
                  <input
                    type="number"
                    value={dailyLimitTotal}
                    onChange={e => setDailyLimitTotal(e.target.value)}
                    placeholder="Без лимита"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>
                <button
                  onClick={handleSaveLimits}
                  disabled={savingLimits}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    opacity: savingLimits ? 0.6 : 1,
                  }}
                >
                  {savingLimits ? 'Сохранение...' : 'Сохранить лимиты'}
                </button>
                {limitMsg && <p style={{ fontSize: '0.85rem' }}>{limitMsg}</p>}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
