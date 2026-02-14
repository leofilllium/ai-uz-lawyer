/**
 * Project Board Page
 * GitHub-style dark Kanban board for task management using dnd-kit.
 * Uses inline styles since the project uses vanilla CSS (not Tailwind).
 */

import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  defaultDropAnimationSideEffects,
  type DropAnimation
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../contexts/AuthContext';
import { getTasks, updateTask, createTask, type Task, TaskStatus, TaskPriority, TaskComplexity } from '../api/client';

/* ── Columns ─────────────────────────────────────── */
const COLUMNS = [
  { id: TaskStatus.TO_DO,        title: 'Todo',        color: '#3fb950', subtitle: "This item hasn't been started" },
  { id: TaskStatus.IN_PROGRESS,  title: 'In progress', color: '#d29922', subtitle: 'This is actively being worked on' },
  { id: TaskStatus.DONE,         title: 'Done',        color: '#a371f7', subtitle: 'This has been completed' },
];

/* ── Inline style objects ─────────────────────────── */
const S = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: 'calc(100vh - 64px)',
    background: '#0d1117',
    color: '#c9d1d9',
  },
  boardWrap: {
    flex: 1,
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
  },
  boardInner: {
    display: 'flex',
    gap: '24px',
    padding: '24px',
    height: '100%',
    minWidth: 'max-content',
  },

  /* Column */
  col: {
    width: '350px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    borderRadius: '8px',
    border: '1px solid #30363d',
    background: '#161b22',
    overflow: 'hidden',
  },
  colHeader: {
    padding: '16px',
    borderBottom: '1px solid #21262d',
  },
  colHeaderTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  colHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colTitle: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#c9d1d9',
    margin: 0,
  },
  colCount: {
    fontSize: '12px',
    color: '#8b949e',
  },
  colBadge: {
    fontSize: '10px',
    color: '#8b949e',
    background: '#21262d',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #30363d',
  },
  colSubtitle: {
    fontSize: '12px',
    color: '#8b949e',
    margin: 0,
  },
  colBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '12px',
  },
  colFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    color: '#8b949e',
    fontSize: '14px',
    cursor: 'pointer',
    borderTop: '1px solid #21262d',
    background: 'none',
    border: 'none',
    borderTopWidth: '1px',
    borderTopStyle: 'solid' as const,
    borderTopColor: '#21262d',
    width: '100%',
    textAlign: 'left' as const,
    fontWeight: 500,
  },

  /* Task card */
  card: {
    background: '#0d1117',
    padding: '12px 14px',
    borderRadius: '6px',
    border: '1px solid #30363d',
    cursor: 'grab',
    marginBottom: '8px',
    userSelect: 'none' as const,
    transition: 'border-color 0.15s, background 0.15s',
  },
  cardDragging: {
    opacity: 0.4,
    background: '#21262d',
    border: '2px dashed #30363d',
    borderRadius: '6px',
    height: '80px',
    marginBottom: '8px',
  },
  cardOverlay: {
    background: '#0d1117',
    padding: '12px 14px',
    borderRadius: '6px',
    border: '1px solid #58a6ff',
    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.6)',
    transform: 'rotate(3deg) scale(1.04)',
    cursor: 'grabbing',
    userSelect: 'none' as const,
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#c9d1d9',
    margin: 0,
    lineHeight: '1.4',
  },
  cardDesc: {
    fontSize: '12px',
    color: '#8b949e',
    margin: '6px 0 0',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    lineHeight: '1.5',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #21262d',
  },
  cardBadge: (bg: string) => ({
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    background: bg,
    color: '#fff',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  }),
  cardId: {
    fontSize: '11px',
    color: '#484f58',
    fontFamily: 'monospace',
  },

  /* More button */
  moreBtn: {
    background: 'none',
    border: 'none',
    color: '#8b949e',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },

  /* Add column button */
  addColBtn: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    background: '#21262d',
    color: '#8b949e',
    border: '1px solid #30363d',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: '2px',
  },

  /* Modal */
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '20px',
  },
  modalBox: {
    background: '#161b22',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    border: '1px solid #30363d',
    overflow: 'hidden',
    boxShadow: '0 0 0 1px #30363d, 0 16px 32px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #21262d',
    background: '#0d1117',
  },
  modalTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#c9d1d9',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#8b949e',
    cursor: 'pointer',
    fontSize: '16px',
  },
  modalForm: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#c9d1d9',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#c9d1d9',
    fontSize: '14px',
    outline: 'none',
    minHeight: '100px',
    resize: 'none' as const,
    boxSizing: 'border-box' as const,
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#8b949e',
    marginBottom: '4px',
    display: 'block',
    letterSpacing: '0.5px',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    color: '#c9d1d9',
    fontSize: '14px',
    outline: 'none',
    appearance: 'none' as const,
    boxSizing: 'border-box' as const,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #21262d',
  },
  btnCancel: {
    padding: '8px 16px',
    borderRadius: '6px',
    background: 'none',
    border: '1px solid #30363d',
    color: '#c9d1d9',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  btnCreate: {
    padding: '8px 16px',
    borderRadius: '6px',
    background: '#238636',
    border: '1px solid #2ea043',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
};

/* ── SVG Icons ────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
);

const CircleDot = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="2"/>
  </svg>
);

/* ── Components ───────────────────────────────────── */

function TaskCard({ task, isOverlay = false }: { task: Task; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return <div ref={setNodeRef} style={{ ...dragStyle, ...S.cardDragging }} />;
  }

  const priorityColor =
    task.priority === TaskPriority.URGENT ? '#da3633' :
    task.priority === TaskPriority.HIGH   ? '#d29922' :
    task.priority === TaskPriority.MEDIUM ? '#58a6ff' : '#484f58';

  const complexityColor =
    task.complexity === TaskComplexity.HARD   ? '#a371f7' :
    task.complexity === TaskComplexity.MEDIUM ? '#d29922' : '#3fb950';

  return (
    <div
      ref={setNodeRef}
      style={{ ...dragStyle, ...(isOverlay ? S.cardOverlay : S.card) }}
      {...attributes}
      {...listeners}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={S.cardTitle}>{task.title}</p>
        <span style={S.cardBadge(priorityColor)}>{task.priority}</span>
      </div>
      {task.description && <p style={S.cardDesc}>{task.description}</p>}
      <div style={S.cardMeta}>
        <span style={{ ...S.cardBadge(complexityColor), opacity: 0.8 }}>{task.complexity}</span>
        <span style={S.cardId}>#{task.id}</span>
      </div>
    </div>
  );
}

function ColumnContainer({
  column, tasks, onAddTask,
}: {
  column: typeof COLUMNS[0];
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
}) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'Column', column },
    disabled: true,
  });

  return (
    <div ref={setNodeRef} style={S.col}>
      {/* Header */}
      <div style={S.colHeader}>
        <div style={S.colHeaderTop}>
          <div style={S.colHeaderLeft}>
            <CircleDot color={column.color} />
            <h3 style={S.colTitle}>{column.title}</h3>
            <span style={S.colCount}>{tasks.length}</span>
            <span style={S.colBadge}>Estimate: {tasks.length}</span>
          </div>
          <button style={S.moreBtn}><MoreIcon /></button>
        </div>
        <p style={S.colSubtitle}>{column.subtitle}</p>
      </div>

      {/* Task list */}
      <div style={S.colBody}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div style={{ minHeight: '60px' }}>
            {tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        </SortableContext>
      </div>

      {/* Footer */}
      <button
        onClick={() => onAddTask(column.id as TaskStatus)}
        style={S.colFooter}
      >
        <PlusIcon /> Add item
      </button>
    </div>
  );
}

/* ── Main Component ───────────────────────────────── */

export default function ProjectBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(TaskStatus.TO_DO);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newTaskComplexity, setNewTaskComplexity] = useState<TaskComplexity>(TaskComplexity.MEDIUM);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
  };

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    try { setTasks(await getTasks()); } catch (e) { console.error(e); }
  }

  const openCreateModal = (status: TaskStatus = TaskStatus.TO_DO) => {
    setNewTaskStatus(status);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowModal(true);
  };

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTask({
        title: newTaskTitle,
        description: newTaskDesc,
        status: newTaskStatus,
        priority: newTaskPriority,
        complexity: newTaskComplexity,
        organization_id: user?.organization_id!,
        reporter_id: user?.id!,
      });
      setShowModal(false);
      loadTasks();
    } catch { alert('Failed to create task'); }
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Task') setActiveTask(event.active.data.current.task);
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    let newStatus = task.status;
    const col = COLUMNS.find(c => c.id === over.id);
    if (col) {
      newStatus = col.id as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) newStatus = overTask.status;
    }

    if (task.status !== newStatus) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: newStatus } : t));
      try { await updateTask(task.id, { status: newStatus }); }
      catch { console.error('Failed to update'); loadTasks(); }
    }
  }

  return (
    <div style={S.page}>
      {/* Board */}
      <div style={S.boardWrap}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div style={S.boardInner}>
            {COLUMNS.map(col => (
              <ColumnContainer
                key={col.id}
                column={col}
                tasks={tasks.filter(t => t.status === col.id)}
                onAddTask={openCreateModal}
              />
            ))}
            {/* Add-column button */}
            <div style={{ paddingTop: '2px', flexShrink: 0 }}>
              <button style={S.addColBtn}><PlusIcon /></button>
            </div>
          </div>
          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div style={S.modalOverlay}>
          <div style={S.modalBox}>
            <div style={S.modalHeader}>
              <span style={S.modalTitle}>Create New Item</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask} style={S.modalForm}>
              <div>
                <input
                  style={S.input}
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                />
              </div>
              <div>
                <textarea
                  style={S.textarea}
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                  placeholder="Add a description..."
                />
              </div>
              <div style={S.formRow}>
                <div>
                  <label style={S.label}>Priority</label>
                  <select
                    style={S.select}
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                  >
                    {Object.values(TaskPriority).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Complexity</label>
                  <select
                    style={S.select}
                    value={newTaskComplexity}
                    onChange={e => setNewTaskComplexity(e.target.value as TaskComplexity)}
                  >
                    {Object.values(TaskComplexity).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.modalFooter}>
                <button type="button" style={S.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={S.btnCreate}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
