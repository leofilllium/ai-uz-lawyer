/**
 * ProjectBoard — Kanban board with 6 status columns.
 * Uses design-system CSS classes (no inline dark styles).
 * Drag-and-drop via @dnd-kit to move tasks across columns.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import {
  getTasks,
  updateTask,
  logout,
  getMe,
  type Task,
  TaskStatus,
  type User,
} from '../api/client';

/* ───── constants ───── */
const COLUMNS = [
  { id: TaskStatus.BACKLOG, title: 'Бэклог', color: '#8b949e' },
  { id: TaskStatus.TO_DO, title: 'To Do', color: '#3fb950' },
  { id: TaskStatus.IN_PROGRESS, title: 'В процессе', color: '#d29922' },
  { id: TaskStatus.REVIEW, title: 'На проверке', color: '#58a6ff' },
  { id: TaskStatus.DONE, title: 'Завершено', color: '#a371f7' },
  { id: TaskStatus.RE_DO, title: 'Переделать', color: '#da3633' },
];

/* ───── Task Card (sortable) ───── */
function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`board-task-card${isSortDragging ? ' board-task-card--dragging' : ''}`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isSortDragging) {
          e.stopPropagation();
          navigate(`/project-board/${task.id}`);
        }
      }}
    >
      <div className="board-task-card__title">{task.title}</div>
      {task.description && (
        <div className="board-task-card__desc">{task.description}</div>
      )}
      <div className="board-task-card__meta">
        <span className={`priority-badge priority-badge--${task.priority}`}>
          {task.priority}
        </span>
        <span className={`complexity-badge complexity-badge--${task.complexity}`}>
          {task.complexity}
        </span>
        {task.assignee_name && (
          <span className="board-task-card__assignee" title={task.assignee_name}>
            {task.assignee_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

/* Overlay card (follows cursor while dragging) */
function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="board-task-card--overlay">
      <div className="board-task-card__title">{task.title}</div>
      <div className="board-task-card__meta">
        <span className={`priority-badge priority-badge--${task.priority}`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
}

/* ───── Column ───── */
function BoardColumn({
  column,
  tasks,
  canCreate,
  onAdd,
}: {
  column: (typeof COLUMNS)[number];
  tasks: Task[];
  canCreate: boolean;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className="board-column"
      style={isOver ? { boxShadow: `0 0 0 2px ${column.color}` } : undefined}
    >
      <div className="board-column__header">
        <span className="board-column__dot" style={{ background: column.color }} />
        <span className="board-column__title">{column.title}</span>
        <span className="board-column__count">{tasks.length}</span>
      </div>

      <div ref={setNodeRef} className="board-column__body">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 12px',
              color: 'var(--color-text-tertiary)',
              fontSize: '12px',
            }}
          >
            Нет задач
          </div>
        )}
      </div>

      {canCreate && (
        <div className="board-column__footer">
          <button className="board-column__add-btn" onClick={onAdd}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
            </svg>
            Добавить задачу
          </button>
        </div>
      )}
    </div>
  );
}

/* ───── Main Board ───── */
export default function ProjectBoard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* load data */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [u, t] = await Promise.all([getMe(), getTasks()]);
        if (cancelled) return;
        setUser(u);
        setTasks(t);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const canCreate = user?.role === 'SENIOR' || user?.role === 'HEAD';

  /* dnd */
  const onDragStart = useCallback(
    (e: DragStartEvent) => {
      const t = tasks.find((task) => task.id === e.active.id);
      setActiveTask(t || null);
    },
    [tasks]
  );

  const onDragEnd = useCallback(
    async (e: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = e;
      if (!over) return;

      const draggedTask = tasks.find((t) => t.id === active.id);
      if (!draggedTask) return;

      // Determine target column
      let targetStatus: TaskStatus | null = null;

      // Check if dropped directly on a column
      const colIds = COLUMNS.map((c) => c.id);
      if (colIds.includes(over.id as string as TaskStatus)) {
        targetStatus = over.id as string as TaskStatus;
      } else {
        // Dropped on another task — use that task's status
        const overTask = tasks.find((t) => t.id === over.id);
        if (overTask) targetStatus = overTask.status;
      }

      if (!targetStatus || targetStatus === draggedTask.status) return;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === draggedTask.id ? { ...t, status: targetStatus! } : t))
      );

      try {
        await updateTask(draggedTask.id, { status: targetStatus } as any);
      } catch {
        // Revert
        setTasks((prev) =>
          prev.map((t) => (t.id === draggedTask.id ? { ...t, status: draggedTask.status } : t))
        );
      }
    },
    [tasks]
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    COLUMNS.forEach((c) => (map[c.id] = []));
    tasks.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [tasks]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* Time display */
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="board-page" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <div className="pulse" style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="board-page">
      {/* ── Header (matching Dashboard design) ── */}
      <header ref={headerRef} className="dash-header">
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
                Юридическая платформа
              </h1>
              <span className="dash-header__subtitle">Доска проектов</span>
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

      {/* ── Board ── */}
      <div className="board-content">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="board-columns">
            {COLUMNS.map((col) => (
              <BoardColumn
                key={col.id}
                column={col}
                tasks={tasksByStatus[col.id] || []}
                canCreate={canCreate}
                onAdd={() => navigate('/project-board/new')}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
