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
          <h1>⚖️ AI Юрист</h1>
          <p className="text-xl font-semibold mt-4">Ожидание подтверждения</p>
        </div>

        <div className="py-6">
          <div className="mb-6 flex justify-center">
            <span style={{ fontSize: '4rem' }}>⏳</span>
          </div>
          
          <p className="text-gray-600 mb-2">
            Уважаемый <strong>{user?.name}</strong>,
          </p>
          <p className="text-gray-600 mb-6">
            Ваша учетная запись была успешно создана, но требует подтверждения администратора вашей организации для доступа к системе.
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
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
