/**
 * TaskDetail — GitHub-style task/issue detail page.
 * Shows description, sidebar metadata, comments, attachments, and role-based actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getTask,
  updateTask,
  addTaskComment,
  deleteTaskComment,
  deleteTaskAttachment,
  downloadTaskAttachment,
  getMe,
  type User,
  type TaskDetail as TaskDetailType,
  TaskStatus,
} from '../api/client';

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  TO_DO: 'To Do',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  DONE: 'Завершено',
  RE_DO: 'На доработке',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

const COMPLEXITY_LABELS: Record<string, string> = {
  EASY: 'Лёгкая',
  MEDIUM: 'Средняя',
  HARD: 'Сложная',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн. назад`;
}

export default function TaskDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const taskId = Number(id);

  const [task, setTask] = useState<TaskDetailType | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [me, t] = await Promise.all([getMe(), getTask(taskId)]);
      setUser(me);
      setTask(t);
    } catch {
      navigate('/project-board');
    } finally {
      setLoading(false);
    }
  }, [taskId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusAction = async (newStatus: TaskStatus) => {
    if (!task) return;
    setActionLoading(true);
    try {
      await updateTask(task.id, { status: newStatus } as any);
      setTask((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch {
      alert('Ошибка при обновлении статуса');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !task) return;
    setSubmittingComment(true);
    try {
      const newComment = await addTaskComment(task.id, commentText.trim());
      setTask((prev) =>
        prev ? { ...prev, comments: [...prev.comments, newComment] } : prev
      );
      setCommentText('');
    } catch {
      alert('Ошибка при добавлении комментария');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!task) return;
    try {
      await deleteTaskComment(task.id, commentId);
      setTask((prev) =>
        prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) } : prev
      );
    } catch {
      /* ignore */
    }
  };

  const handleDeleteAttachment = async (attId: number) => {
    if (!task) return;
    try {
      await deleteTaskAttachment(task.id, attId);
      setTask((prev) =>
        prev ? { ...prev, attachments: prev.attachments.filter((a) => a.id !== attId) } : prev
      );
    } catch {
      /* ignore */
    }
  };

  const handleLogout = () => {
    import('../api/client').then((m) => m.logout());
    navigate('/login');
  };

  if (loading || !task) {
    return (
      <div className="task-detail-page" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <div style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>Загрузка...</div>
      </div>
    );
  }

  const isEmployee = user?.role === 'EMPLOYEE';
  const isSeniorOrHead = user?.role === 'SENIOR' || user?.role === 'HEAD';

  return (
    <div className="task-detail-page">
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
              <span className="dash-header__subtitle">Задача #{task.id}</span>
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

      {/* Back navigation */}
      <div style={{ padding: 'var(--space-lg) var(--space-xl) 0', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/project-board')}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 16px',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
            }}
          >
            ← Доска
          </button>
          {isSeniorOrHead && (
            <button
              onClick={() => navigate(`/project-board/${task.id}/edit`)}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 16px',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-body)',
              }}
            >
              ✎ Редактировать
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="task-detail-content">
        {/* Main */}
        <div className="task-detail-main">
          {/* Title + Status */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span className={`status-badge status-badge--${task.status}`}>
                {STATUS_LABELS[task.status] || task.status}
              </span>
            </div>
            <h1>{task.title}</h1>
          </div>

          {/* Description */}
          {task.description && (
            <div className="task-detail-description">
              <h3>📝 Описание</h3>
              <div className="task-detail-description__body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {task.description}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <div className="attachments-section">
              <h3>📎 Файлы ({task.attachments.length})</h3>
              <div className="attachment-list">
                {task.attachments.map((a) => (
                  <div key={a.id} className="attachment-item">
                    <div className="attachment-icon">📄</div>
                    <div className="attachment-info">
                      <div className="attachment-name">{a.filename}</div>
                      <div className="attachment-size">{formatBytes(a.file_size)}</div>
                    </div>
                    <div className="attachment-actions">
                      <button
                        className="attachment-download"
                        onClick={() => downloadTaskAttachment(task.id, a.id, a.filename)}
                        title="Скачать"
                      >
                        ⬇
                      </button>
                      {(user?.id === a.uploaded_by || user?.role === 'HEAD') && (
                        <button className="attachment-delete" onClick={() => handleDeleteAttachment(a.id)}>
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="comments-section">
            <div className="comments-section__header">
              💬 Комментарии ({task.comments.length})
            </div>

            {task.comments.length > 0 && (
              <ul className="comment-list">
                {task.comments.map((c) => (
                  <li key={c.id} className="comment-item">
                    <div className="comment-avatar">
                      {c.user_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-author">{c.user_name}</span>
                        <span className="comment-time">{timeAgo(c.created_at)}</span>
                      </div>
                      <div className="comment-text">{c.content}</div>
                    </div>
                    {(user?.id === c.user_id || user?.role === 'HEAD') && (
                      <button className="comment-delete" onClick={() => handleDeleteComment(c.id)}>
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {task.comments.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
                Пока нет комментариев
              </div>
            )}

            <form className="comment-form" onSubmit={handleAddComment}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Написать комментарий..."
                rows={2}
              />
              <button type="submit" disabled={!commentText.trim() || submittingComment}>
                {submittingComment ? '...' : 'Отправить'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="task-detail-sidebar">
          <div className="sidebar-field">
            <span className="sidebar-field__label">Статус</span>
            <span className={`status-badge status-badge--${task.status}`}>
              {STATUS_LABELS[task.status] || task.status}
            </span>
          </div>

          <div className="sidebar-field">
            <span className="sidebar-field__label">Приоритет</span>
            <span className="sidebar-field__value">
              <span className={`priority-badge priority-badge--${task.priority}`}>
                {PRIORITY_LABELS[task.priority] || task.priority}
              </span>
            </span>
          </div>

          <div className="sidebar-field">
            <span className="sidebar-field__label">Сложность</span>
            <span className="sidebar-field__value">
              <span className={`complexity-badge complexity-badge--${task.complexity}`}>
                {COMPLEXITY_LABELS[task.complexity] || task.complexity}
              </span>
            </span>
          </div>

          <div className="sidebar-field">
            <span className="sidebar-field__label">Исполнитель</span>
            <span className="sidebar-field__value">{task.assignee_name || 'Не назначен'}</span>
          </div>

          <div className="sidebar-field">
            <span className="sidebar-field__label">Автор</span>
            <span className="sidebar-field__value">{task.reporter_name || '—'}</span>
          </div>

          {task.deadline && (
            <div className="sidebar-field">
              <span className="sidebar-field__label">Дедлайн</span>
              <span className="sidebar-field__value">
                {new Date(task.deadline).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          <div className="sidebar-field">
            <span className="sidebar-field__label">Создано</span>
            <span className="sidebar-field__value">{timeAgo(task.created_at)}</span>
          </div>

          {/* Role-based action buttons */}
          <div className="sidebar-actions">
            {/* Employee: Send to Review */}
            {isEmployee && task.status === TaskStatus.IN_PROGRESS && (
              <button
                className="btn-status-action btn-status-action--review"
                onClick={() => handleStatusAction(TaskStatus.REVIEW)}
                disabled={actionLoading}
              >
                📤 На проверку
              </button>
            )}

            {/* Senior / Head: Mark Done */}
            {isSeniorOrHead && task.status === TaskStatus.REVIEW && (
              <>
                <button
                  className="btn-status-action btn-status-action--done"
                  onClick={() => handleStatusAction(TaskStatus.DONE)}
                  disabled={actionLoading}
                >
                  ✅ Завершить
                </button>
                <button
                  className="btn-status-action btn-status-action--redo"
                  onClick={() => handleStatusAction(TaskStatus.RE_DO)}
                  disabled={actionLoading}
                >
                  🔄 На доработку
                </button>
              </>
            )}

            {/* Move to In Progress */}
            {(task.status === TaskStatus.TO_DO || task.status === TaskStatus.RE_DO) && (
              <button
                className="btn-status-action btn-status-action--review"
                onClick={() => handleStatusAction(TaskStatus.IN_PROGRESS)}
                disabled={actionLoading}
                style={{ background: 'rgba(210,153,34,0.12)', color: '#d29922', borderColor: 'rgba(210,153,34,0.3)' }}
              >
                🚀 Взять в работу
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
