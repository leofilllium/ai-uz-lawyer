/**
 * Project Board Page
 * Premium Kanban board for task management using dnd-kit.
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
  { id: TaskStatus.BACKLOG, title: 'Backlog', color: '#6c757d', bg: '#f8f9fa' },
  { id: TaskStatus.TO_DO, title: 'To Do', color: '#007bff', bg: '#e7f1ff' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: '#ffc107', bg: '#fff9db' },
  { id: TaskStatus.REVIEW, title: 'In Review', color: '#17a2b8', bg: '#e0faff' },
  { id: TaskStatus.DONE, title: 'Done', color: '#28a745', bg: '#d4edda' },
  { id: TaskStatus.RE_DO, title: 'Re-Do', color: '#dc3545', bg: '#f8d7da' },
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
        className="opacity-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl h-[120px] mb-3"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white p-4 rounded-xl border border-gray-200 cursor-grab active:cursor-grabbing 
        hover:border-[var(--color-primary)] hover:shadow-md transition-all group mb-3 select-none
        ${isOverlay ? 'shadow-2xl rotate-2 scale-105 cursor-grabbing z-50' : 'shadow-sm'}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
          task.priority === TaskPriority.URGENT ? 'bg-red-50 text-red-600 border border-red-100' :
          task.priority === TaskPriority.HIGH ? 'bg-orange-50 text-orange-600 border border-orange-100' :
          task.priority === TaskPriority.MEDIUM ? 'bg-blue-50 text-blue-600 border border-blue-100' :
          'bg-gray-50 text-gray-600 border border-gray-100'
        }`}>
          {task.priority}
        </span>
        <span className="text-[10px] text-gray-400 font-mono">#{task.id}</span>
      </div>
      
      <h4 className="font-bold text-gray-800 mb-1 leading-snug">{task.title}</h4>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      
      <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-50 mt-2">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${
            task.complexity === TaskComplexity.HARD ? 'bg-purple-400' :
            task.complexity === TaskComplexity.MEDIUM ? 'bg-yellow-400' : 'bg-green-400'
          }`}></span>
          {task.complexity}
        </div>
        <div>
          {new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
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
    <div 
      ref={setNodeRef} 
      className="flex-shrink-0 flex flex-col h-full w-[300px] select-none"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full ring-2 ring-opacity-50" style={{ backgroundColor: column.color, '--tw-ring-color': column.color } as any}></div>
          <h3 className="font-bold text-gray-700 text-sm tracking-wide">{column.title}</h3>
        </div>
        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-200">
          {tasks.length}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-1 pb-4 scrollbar-hide">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col min-h-[150px] rounded-xl transition-colors duration-200" style={{ backgroundColor: tasks.length === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
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
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Project Board</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tasks and track progress</p>
        </div>
        
        {isSeniorOrHead && (
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            <PlusIcon /> New Task
          </button>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-6 h-full p-8 min-w-max">
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
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'var(--font-display)' }}>Create New Task</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6 flex flex-col gap-5">
              <div className="form-group">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Title</label>
                <input 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Draft NDA for Client X"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Description</label>
                <textarea 
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all min-h-[120px] resize-none"
                  placeholder="Add details about this task..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="form-group">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Priority</label>
                  <select 
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all appearance-none"
                  >
                    {Object.values(TaskPriority).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">Complexity</label>
                  <select 
                    value={newTaskComplexity}
                    onChange={e => setNewTaskComplexity(e.target.value as TaskComplexity)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all appearance-none"
                  >
                    {Object.values(TaskComplexity).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg transition-all transform active:scale-95"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
