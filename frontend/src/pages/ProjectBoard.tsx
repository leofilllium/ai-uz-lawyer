/**
 * Project Board Page
 * Dark-themed Kanban board matching the specific user design.
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

// Icons
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const MoreHorizontalIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
const CircleIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

// Columns configuration matching the screenshot
const COLUMNS = [
  { 
    id: TaskStatus.TO_DO, 
    title: 'Todo', 
    color: '#28a745', // Green
    subtitle: "This item hasn't been started"
  },
  { 
    id: TaskStatus.IN_PROGRESS, 
    title: 'In progress', 
    color: '#ffc107', // Orange/Yellow
    subtitle: 'This is actively being worked on'
  },
  { 
    id: TaskStatus.DONE, 
    title: 'Done', 
    color: '#6f42c1', // Purple
    subtitle: 'This has been completed'
  },
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
        className="opacity-50 bg-[#2C2C2C] border border-[#3E3E3E] rounded-lg h-[80px] mb-2"
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
        bg-[#1E1E1E] p-3 rounded-lg border border-[#333] cursor-grab active:cursor-grabbing 
        hover:bg-[#252525] transition-colors group mb-2 select-none relative
        ${isOverlay ? 'shadow-2xl scale-105 cursor-grabbing z-50 border-[#444]' : 'shadow-sm'}
      `}
    >
      <div className="flex justify-between items-start mb-1.5">
        <h4 className="text-[#E0E0E0] text-sm font-medium leading-snug pr-6">{task.title}</h4>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
          task.priority === TaskPriority.URGENT ? 'bg-red-500' :
          task.priority === TaskPriority.HIGH ? 'bg-orange-500' :
          task.priority === TaskPriority.MEDIUM ? 'bg-blue-500' : 'bg-gray-600'
        }`} />
      </div>
      
      {task.description && (
        <p className="text-[#A0A0A0] text-xs line-clamp-2 mb-2">{task.description}</p>
      )}
      
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] px-1.5 py-0.5 bg-[#333] text-[#888] rounded border border-[#444]">
          {task.complexity}
        </span>
         <span className="text-[10px] text-[#666] ml-auto">
          #{task.id}
        </span>
      </div>
    </div>
  );
}

function ColumnContainer({ 
  column, 
  tasks,
  onAddTask
}: { 
  column: typeof COLUMNS[0]; 
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
}) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
    disabled: true,
  });

  return (
    <div 
      ref={setNodeRef} 
      className="flex-shrink-0 flex flex-col h-full w-[350px] select-none rounded-xl overflow-hidden border border-[#333] bg-[#0F0F0F]" // Darker column bg
    >
      {/* Header */}
      <div className="p-4 border-b border-[#222]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <CircleIcon color={column.color} />
            <h3 className="font-semibold text-[#E0E0E0] text-sm">{column.title}</h3>
            <span className="text-[#666] text-xs">{tasks.length}</span>
            <span className="text-[#444] text-[10px] bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#2a2a2a]">
              Estimate: 0
            </span>
          </div>
          <button className="text-[#666] hover:text-[#999]">
            <MoreHorizontalIcon />
          </button>
        </div>
        <p className="text-[#666] text-xs">{column.subtitle}</p>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col min-h-[50px]">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>

      {/* Add Item Footer */}
      <button 
        onClick={() => onAddTask(column.id as TaskStatus)}
        className="flex items-center gap-2 p-3 text-[#888] hover:text-[#CCC] hover:bg-[#1A1A1A] transition-colors text-sm font-medium border-t border-[#222]"
      >
        <PlusIcon /> Add item
      </button>
    </div>
  );
}

// --- Main Page Component ---

export default function ProjectBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // New task state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(TaskStatus.TO_DO);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newTaskComplexity, setNewTaskComplexity] = useState<TaskComplexity>(TaskComplexity.MEDIUM);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  };

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

  // --- Actions ---

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
    } catch (e) {
      alert("Failed to create task");
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

    let newStatus = activeTask.status;
    
    // Check if dropped on a column
    const column = COLUMNS.find(c => c.id === overId);
    if (column) {
      newStatus = column.id as TaskStatus;
    } else {
      // Check if dropped on a task
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (activeTask.status !== newStatus) {
      setTasks(tasks => tasks.map(t => 
        t.id === activeId ? { ...t, status: newStatus } : t
      ));
      
      try {
        await updateTask(activeTask.id, { status: newStatus });
      } catch (e) {
        console.error("Failed to update task", e);
        loadTasks();
      }
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#080808] text-[#E0E0E0]"> {/* Main page bg */}
      {/* Header can be minimal or hidden since visuals focus on board, keeping minimal */}
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 h-full p-6 min-w-max">
            {COLUMNS.map(column => (
              <ColumnContainer
                key={column.id}
                column={column}
                tasks={tasks.filter(t => t.status === column.id)}
                onAddTask={openCreateModal}
              />
            ))}
            
            {/* Pseudo "Add Column" button as in screenshot */}
            <div className="w-[50px] pt-2">
              <button className="w-10 h-10 flex items-center justify-center rounded bg-[#1A1A1A] text-[#888] hover:bg-[#252525] border border-[#333]">
                <PlusIcon />
              </button>
            </div>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create Modal - Styled Dark */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181818] rounded-xl w-full max-w-lg shadow-2xl border border-[#333] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#333] flex justify-between items-center bg-[#202020]">
              <h2 className="text-sm font-bold text-[#E0E0E0] uppercase tracking-wide">Create New Item</h2>
              <button onClick={() => setShowModal(false)} className="text-[#666] hover:text-[#AAA]">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6 flex flex-col gap-5">
              <div className="form-group">
                <input 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg focus:border-[#555] focus:outline-none text-[#DDD] placeholder-[#555] transition-colors"
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <textarea 
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg focus:border-[#555] focus:outline-none text-[#DDD] placeholder-[#555] transition-colors min-h-[100px] resize-none text-sm"
                  placeholder="Add a description..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="form-group">
                    <label className="text-[10px] uppercase font-bold text-[#555] mb-1.5 block">Priority</label>
                    <div className="relative">
                      <select 
                        value={newTaskPriority}
                        onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                        className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm text-[#CCC] appearance-none focus:outline-none"
                      >
                         {Object.values(TaskPriority).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      {/* Arrow */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555]">▼</div>
                    </div>
                 </div>
                 
                 <div className="form-group">
                    <label className="text-[10px] uppercase font-bold text-[#555] mb-1.5 block">Complexity</label>
                     <div className="relative">
                      <select 
                        value={newTaskComplexity}
                        onChange={e => setNewTaskComplexity(e.target.value as TaskComplexity)}
                        className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm text-[#CCC] appearance-none focus:outline-none"
                      >
                         {Object.values(TaskComplexity).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555]">▼</div>
                    </div>
                 </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded text-[#888] hover:text-[#EEE] text-sm hover:bg-[#222] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded bg-[#007bff] text-white font-medium hover:bg-[#0069d9] shadow-lg text-sm transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
