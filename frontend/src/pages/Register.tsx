/**
 * Register Page
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getOrganizations, type Organization } from '../api/client';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadOrgs() {
      try {
        const orgs = await getOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0) {
          setOrganizationId(orgs[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load organizations", err);
      }
    }
    loadOrgs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (!organizationId) {
      setError('Выберите организацию');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password, parseInt(organizationId));
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>⚖️ Юридическая платформа</h1>
          <p>Создание аккаунта</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Имя</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              required
              minLength={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="organization">Организация</label>
            <select
              id="organization"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              required
              className="w-full h-11 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              style={{
                 height: '44px',
                 padding: '0 14px',
                 border: '1.5px solid var(--color-border)',
                 borderRadius: 'var(--radius-md)',
                 fontSize: '14px',
                 fontFamily: 'var(--font-body)',
                 color: 'var(--color-text-primary)',
                 background: 'var(--color-background)',
              }}
            >
              <option value="" disabled>Выберите юридическую фирму</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
