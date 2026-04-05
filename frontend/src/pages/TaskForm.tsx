/**
 * TaskForm — Full-page task create/edit form.
 * Accessed at /project-board/new or /project-board/:id/edit
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  createTask,
  updateTask,
  getTask,
  getOrgUsers,
  uploadTaskAttachment,
  deleteTaskAttachment,
  getMe,
  type User,
  type TaskAttachment,
} from '../api/client';

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const COMPLEXITY_OPTIONS = ['EASY', 'MEDIUM', 'HARD'] as const;
const STATUS_OPTIONS = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TO_DO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'DONE', label: 'Done' },
  { value: 'RE_DO', label: 'Re-Do' },
] as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function TaskForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [complexity, setComplexity] = useState<string>('MEDIUM');
  const [status, setStatus] = useState<string>('TO_DO');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [deadline, setDeadline] = useState('');
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');


  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [me, users] = await Promise.all([getMe(), getOrgUsers()]);
        if (cancelled) return;
        setUser(me);
        setOrgUsers(users);

        if (isEdit) {
          const task = await getTask(Number(id));
          if (cancelled) return;
          setTitle(task.title);
          setDescription(task.description || '');
          setPriority(task.priority);
          setComplexity(task.complexity);
          setStatus(task.status);
          setAssigneeId(task.assignee_id?.toString() || '');
          setDeadline(task.deadline?.slice(0, 16) || '');
          setAttachments(task.attachments);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        complexity,
        assignee_id: assigneeId ? Number(assigneeId) : undefined,
        deadline: deadline || undefined,
      };

      let taskId: number;

      if (isEdit) {
        payload.status = status;
        const updated = await updateTask(Number(id), payload);
        taskId = updated.id;
      } else {
        const created = await createTask(payload);
        taskId = created.id;
      }

      // Upload pending files
      for (const file of pendingFiles) {
        await uploadTaskAttachment(taskId, file);
      }

      navigate(`/project-board/${taskId}`);
    } catch (err) {
      alert('Ошибка: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingAttachment = async (attId: number) => {
    try {
      await deleteTaskAttachment(Number(id), attId);
      setAttachments((prev) => prev.filter((a) => a.id !== attId));
    } catch {
      /* ignore */
    }
  };

  const handleLogout = () => {
    import('../api/client').then((m) => m.logout());
    navigate('/login');
  };

  /* ── Markdown editor helpers ── */
  const wrapSelection = (before: string, after: string) => {
    const ta = descRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = description.slice(start, end);
    const newText =
      description.slice(0, start) + before + selected + after + description.slice(end);
    setDescription(newText);
    // restore cursor position after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, end + before.length);
    });
  };

  const insertAtLine = (prefix: string) => {
    const ta = descRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    // Find beginning of current line
    const lineStart = description.lastIndexOf('\n', start - 1) + 1;
    const newText =
      description.slice(0, lineStart) + prefix + description.slice(lineStart);
    setDescription(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  if (loading) {
    return (
      <div className="task-form-page" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <div style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="task-form-page">
      {/* Header */}
      <header className="inner-topbar">
        <div className="inner-topbar__left">
          <span className="inner-topbar__brand" onClick={() => navigate('/dashboard')}>LawyerAI</span>
          <span className="inner-topbar__sep" />
          <span className="inner-topbar__page">{isEdit ? 'Редактирование задачи' : 'Новая задача'}</span>
        </div>
        <div className="inner-topbar__right">
          {user && (
            <div className="inner-topbar__user" title={user.name || ''}>
              <span className="inner-topbar__avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
              <span className="inner-topbar__name">{user.name}</span>
            </div>
          )}
          <button onClick={handleLogout} className="inner-topbar__btn">Выход</button>
        </div>
      </header>

      {/* Form */}
      <div className="task-form-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/project-board')}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', height: 'auto', fontSize: '13px' }}
          >
            ← Назад
          </button>
          <h1 style={{ margin: 0 }}>{isEdit ? 'Редактировать задачу' : 'Создать задачу'}</h1>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Название *</label>
            <input
              className="form-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название задачи..."
              required
            />
          </div>

          {/* Description — Rich Markdown Editor */}
          <div className="form-group">
            <label className="form-label">Описание</label>
            <div className="md-editor">
              {/* Tabs */}
              <div className="md-editor__tabs">
                <button
                  type="button"
                  className={`md-editor__tab ${editorTab === 'write' ? 'md-editor__tab--active' : ''}`}
                  onClick={() => setEditorTab('write')}
                >
                  ✏️ Редактор
                </button>
                <button
                  type="button"
                  className={`md-editor__tab ${editorTab === 'preview' ? 'md-editor__tab--active' : ''}`}
                  onClick={() => setEditorTab('preview')}
                >
                  👁 Просмотр
                </button>
              </div>

              {/* Toolbar */}
              {editorTab === 'write' && (
                <div className="md-editor__toolbar">
                  <button type="button" title="Жирный (Ctrl+B)" onClick={() => wrapSelection('**', '**')}>B</button>
                  <button type="button" title="Курсив (Ctrl+I)" onClick={() => wrapSelection('*', '*')}><em>I</em></button>
                  <span className="md-toolbar__sep" />
                  <button type="button" title="Заголовок" onClick={() => insertAtLine('## ')}>H</button>
                  <button type="button" title="Цитата" onClick={() => insertAtLine('> ')}>❝</button>
                  <button type="button" title="Код" onClick={() => wrapSelection('`', '`')}>{'</>'}</button>
                  <button type="button" title="Блок кода" onClick={() => wrapSelection('\n```\n', '\n```\n')}>{'{ }'}</button>
                  <span className="md-toolbar__sep" />
                  <button type="button" title="Список" onClick={() => insertAtLine('- ')}>☰</button>
                  <button type="button" title="Нумерованный список" onClick={() => insertAtLine('1. ')}>1.</button>
                  <button type="button" title="Чекбокс" onClick={() => insertAtLine('- [ ] ')}>☑</button>
                  <span className="md-toolbar__sep" />
                  <button type="button" title="Ссылка" onClick={() => wrapSelection('[', '](url)')}>🔗</button>
                  <button type="button" title="Горизонтальная линия" onClick={() => insertAtLine('\n---\n')}>—</button>
                </div>
              )}

              {/* Editor body */}
              {editorTab === 'write' ? (
                <textarea
                  ref={descRef}
                  className="md-editor__textarea"
                  rows={12}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Подробное описание задачи... (поддерживается Markdown)"
                  onKeyDown={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      if (e.key === 'b') { e.preventDefault(); wrapSelection('**', '**'); }
                      if (e.key === 'i') { e.preventDefault(); wrapSelection('*', '*'); }
                    }
                  }}
                />
              ) : (
                <div className="md-editor__preview">
                  {description.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
                  ) : (
                    <div style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Нет содержимого для отображения</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Priority / Complexity / Status */}
          <div className="task-form__row--3">
            <div className="form-group">
              <label className="form-label">Приоритет</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Сложность</label>
              <select value={complexity} onChange={(e) => setComplexity(e.target.value)}>
                {COMPLEXITY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {isEdit && (
              <div className="form-group">
                <label className="form-label">Статус</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Assignee / Deadline */}
          <div className="task-form__row">
            <div className="form-group">
              <label className="form-label">Исполнитель</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">Не назначен</option>
                {orgUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Дедлайн</label>
              <input
                className="form-input"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* File Attachments */}
          <div className="form-group">
            <label className="form-label">Файлы</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('upload-zone--active'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('upload-zone--active')}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('upload-zone--active');
                handleFileSelect(e.dataTransfer.files);
              }}
            >
              <div className="upload-zone__icon">📎</div>
              <div className="upload-zone__text">Нажмите или перетащите файлы</div>
              <div className="upload-zone__hint">Максимум 10 МБ на файл</div>
            </div>

            {/* Existing attachments (edit mode) */}
            {attachments.length > 0 && (
              <div className="attachment-list" style={{ marginTop: '12px' }}>
                {attachments.map((a) => (
                  <div key={a.id} className="attachment-item">
                    <div className="attachment-icon">📄</div>
                    <div className="attachment-info">
                      <div className="attachment-name">{a.filename}</div>
                      <div className="attachment-size">{formatBytes(a.file_size)}</div>
                    </div>
                    <button
                      type="button"
                      className="attachment-delete"
                      onClick={() => removeExistingAttachment(a.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending files */}
            {pendingFiles.length > 0 && (
              <div className="attachment-list" style={{ marginTop: '8px' }}>
                {pendingFiles.map((f, i) => (
                  <div key={i} className="attachment-item">
                    <div className="attachment-icon">📎</div>
                    <div className="attachment-info">
                      <div className="attachment-name">{f.name}</div>
                      <div className="attachment-size">{formatBytes(f.size)} · ожидание загрузки</div>
                    </div>
                    <button type="button" className="attachment-delete" onClick={() => removePendingFile(i)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="task-form__actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !title.trim()}
            >
              {submitting ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать задачу'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/project-board')}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
