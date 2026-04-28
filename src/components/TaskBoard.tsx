import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, UserProfile, Lead } from '../types/crm';
import { getUserName, getUserAvatar } from '../lib/userUtils';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Calendar, MoreVertical, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { cn } from '../lib/utils';

interface TaskBoardProps {
  tasks: Task[];
  leads: Lead[];
  users: UserProfile[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: 'pending' | 'completed') => void;
}

const TASK_STATUSES = [
  { id: 'pending', label: 'Pending', color: 'indigo' },
  { id: 'completed', label: 'Completed', color: 'emerald' }
];

const TaskBoard: React.FC<TaskBoardProps> = ({ 
  tasks, 
  leads, 
  users, 
  onTaskClick, 
  onStatusChange 
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveTask((tasks || []).find((t) => t.id === active.id) || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column
    if (overId === 'pending' || overId === 'completed') {
      const task = (tasks || []).find(t => t.id === taskId);
      if (task && task.status !== overId) {
        onStatusChange(taskId, overId as 'pending' | 'completed');
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-8 overflow-x-auto pb-6 min-h-[calc(100vh-300px)]">
        {TASK_STATUSES.map((status) => (
          <TaskColumn
            key={status.id}
            id={status.id}
            label={status.label}
            color={status.color}
            tasks={(tasks || []).filter((t) => t.status === status.id)}
            leads={leads}
            users={users}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: { active: { opacity: '0.5' } },
        }),
      }}>
        {activeId && activeTask ? (
          <TaskItemCard 
            task={activeTask} 
            lead={leads.find(l => l.id === activeTask.leadId)}
            isOverlay 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

interface TaskColumnProps {
  id: string;
  label: string;
  color: string;
  tasks: Task[];
  leads: Lead[];
  users: UserProfile[];
  onTaskClick: (task: Task) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ 
  id, 
  label, 
  color, 
  tasks, 
  leads, 
  onTaskClick 
}) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className="flex flex-col w-96 shrink-0 bg-slate-50/50 dark:bg-slate-900/40 rounded-[32px] border border-slate-200/50 dark:border-white/5 transition-all">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full shadow-sm", colorMap[color] || 'bg-slate-500')} />
          <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-white">{label}</h3>
          <span className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm ml-1">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 space-y-4 overflow-y-auto scrollbar-hide">
        <SortableContext items={(tasks || []).map(t => t.id)} strategy={verticalListSortingStrategy}>
          {(tasks || []).map((task) => (
            <SortableTaskItem 
              key={task.id} 
              task={task} 
              lead={leads.find(l => l.id === task.leadId)}
              onClick={() => onTaskClick(task)} 
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[24px] flex flex-col items-center justify-center text-slate-400 gap-2 opacity-40">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">{label} Clear</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface SortableTaskItemProps {
  task: Task;
  lead?: Lead;
  onClick: () => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ task, lead, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
      <TaskItemCard task={task} lead={lead} />
    </div>
  );
};

const TaskItemCard: React.FC<{ task: Task; lead?: Lead; isOverlay?: boolean }> = ({ task, lead, isOverlay }) => {
  const isOverdue = task.status === 'pending' && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));

  return (
    <Card className={cn(
      "p-5 rounded-[24px] border-none shadow-sm hover:shadow-xl transition-all cursor-grab active:cursor-grabbing group bg-white dark:bg-slate-900",
      isOverlay && "shadow-2xl border-2 border-indigo-500/20 rotate-2 scale-105",
      task.status === 'completed' && "opacity-60"
    )}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <Badge className={cn(
            "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-none",
            task.priority === 'High' ? 'bg-rose-500 text-white' : 
            task.priority === 'Medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
          )}>
            {task.priority}
          </Badge>
          <button className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <h4 className={cn(
          "text-sm font-black tracking-tight leading-snug",
          task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'
        )}>
          {task.title}
        </h4>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
          <Avatar className="w-6 h-6 border-2 border-white dark:border-slate-800">
            <AvatarFallback className="text-[8px] font-black bg-indigo-100 text-indigo-600">{lead?.name?.slice(0, 1) || '?'}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">{lead?.name || 'Unlinked Profile'}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Clock className={cn("w-3.5 h-3.5", isOverdue ? "text-rose-500" : "text-indigo-500")} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-tight",
              isOverdue ? "text-rose-600" : "text-slate-400"
            )}>
              {task.dueDate ? format(parseISO(task.dueDate), 'MMM d, h:mm a') : 'No Date'}
            </span>
          </div>
          {isOverdue && (
            <Badge className="bg-rose-100 text-rose-600 text-[8px] font-black border-none px-2 py-0.5 rounded-md">OVERDUE</Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TaskBoard;
