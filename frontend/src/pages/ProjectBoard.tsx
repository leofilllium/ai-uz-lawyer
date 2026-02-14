/**
 * Project Board Page
 * Kanban board for task management using dnd-kit.
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

// Icons
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;

// Columns configuration
const COLUMNS = [
  { id: TaskStatus.BACKLOG, title: 'Backlog', color: '#6c757d' },
  { id: TaskStatus.TO_DO, title: 'To Do', color: '#007bff' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: '#ffc107' },
  { id: TaskStatus.REVIEW, title: 'In Review', color: '#17a2b8' },
  { id: TaskStatus.DONE, title: 'Done', color: '#28a745' },
  { id: TaskStatus.RE_DO, title: 'Re-Do', color: '#dc3545' },
];

// --- Components ---

function TaskCard({ task, isOverlay = false }: { task: Task; isOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-[100px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group ${isOverlay ? 'shadow-xl rotate-2 scale-105 cursor-grabbing' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          task.priority === TaskPriority.URGENT ? 'bg-red-100 text-red-700' :
          task.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-700' :
          task.priority === TaskPriority.MEDIUM ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {task.priority}
        </span>
        {/* Only show delete for overlay or if implemented */}
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
      <div className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</div>
      
      <div className="flex justify-between items-center text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
        <div>{task.complexity}</div>
        <div>{new Date(task.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  );
}

function ColumnContainer({ 
  column, 
  tasks 
}: { 
  column: typeof COLUMNS[0]; 
  tasks: Task[];
}) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
    disabled: true, // Columns are static for now
  });

  return (
    <div ref={setNodeRef} className="bg-gray-100 rounded-xl w-[300px] flex-shrink-0 flex flex-col h-full max-h-full">
      {/* Header */}
      <div className="p-4 font-semibold text-gray-700 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }}></div>
          {column.title}
          <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-3 overflow-y-auto min-h-[100px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function ProjectBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newTaskComplexity, setNewTaskComplexity] = useState<TaskComplexity>(TaskComplexity.MEDIUM);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Requires 3px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    }
  }

  // --- Drag Handlers ---

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Dropped on a column
    let newStatus = activeTask.status;
    
    // If dropped on a column directly
    if (COLUMNS.some(c => c.id === overId)) {
      newStatus = overId as TaskStatus;
    } 
    // If dropped on another task
    else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (activeTask.status !== newStatus) {
      // Optimistic update
      setTasks(tasks => tasks.map(t => 
        t.id === activeId ? { ...t, status: newStatus } : t
      ));
      
      // API Call
      try {
        await updateTask(activeTask.id, { status: newStatus });
      } catch (e) {
        console.error("Failed to update task", e);
        loadTasks(); // Revert on error
      }
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTask({
        title: newTaskTitle,
        description: newTaskDesc,
        status: TaskStatus.BACKLOG, // Default to backlog
        priority: newTaskPriority,
        complexity: newTaskComplexity,
        organization_id: user?.organization_id!,
        reporter_id: user?.id!,
      });
      setShowModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      loadTasks();
    } catch (e) {
      alert("Failed to create task");
    }
  }

  const isSeniorOrHead = user?.role === 'SENIOR' || user?.role === 'HEAD';

  return (
    <div className="h-[calc(100vh-80px)] p-6 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Управление задачами</h1>
          <div className="text-sm text-gray-500">Канбан-доска вашей фирмы</div>
        </div>
        
        {isSeniorOrHead && (
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <PlusIcon /> Новая задача
          </button>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {COLUMNS.map(column => (
            <ColumnContainer
              key={column.id}
              column={column}
              tasks={tasks.filter(t => t.status === column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 font-display">Создать задачу</h2>
            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Заголовок</label>
                <input 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Описание</label>
                <textarea 
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Приоритет</label>
                  <select 
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    {Object.values(TaskPriority).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Сложность</label>
                  <select 
                    value={newTaskComplexity}
                    onChange={e => setNewTaskComplexity(e.target.value as TaskComplexity)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    {Object.values(TaskComplexity).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
