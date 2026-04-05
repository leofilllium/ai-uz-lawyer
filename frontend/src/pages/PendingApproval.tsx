/**
 * Pending Approval Page
 */
import { useAuth } from '../contexts/AuthContext';

export default function PendingApproval() {
  const { logout, user } = useAuth();

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <h1>Юридическая платформа</h1>
          <p style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', color: 'var(--color-text-primary)' }}>Ожидание подтверждения</p>
        </div>

        <div style={{ padding: '24px 0' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Уважаемый <strong>{user?.name}</strong>,
          </p>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            Ваша учетная запись была успешно создана, но требует подтверждения администратора вашей организации для доступа к системе.
          </p>

          <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '32px' }}>
            Пожалуйста, свяжитесь с руководителем вашей юридической фирмы для ускорения процесса.
          </p>
        </div>

        <button onClick={logout} className="btn-secondary" style={{ width: '100%' }}>
          Выйти и проверить позже
        </button>
      </div>
    </div>
  );
}
