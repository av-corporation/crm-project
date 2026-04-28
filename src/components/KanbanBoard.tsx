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
  DragOverEvent,
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
import { Lead, StatusConfig, UserProfile } from '../types/crm';
import { getUserName, getUserAvatar } from '../lib/userUtils';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Phone, MapPin, Package, Calendar, MoreVertical, Clock } from 'lucide-react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { cn } from '../lib/utils';
import StatusSelector from './StatusSelector';

interface KanbanBoardProps {
  leads: Lead[];
  statuses: StatusConfig[];
  users: UserProfile[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: string) => void;
  onRefreshStatuses?: () => void;
  onManageStatuses?: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  leads, 
  statuses, 
  users, 
  onLeadClick, 
  onStatusChange,
  onRefreshStatuses,
  onManageStatuses
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveLead((leads || []).find((l) => l.id === active.id) || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: handle visual feedback during drag over
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column or another lead
    const overStatus = (statuses || []).find(s => s.id === overId || (leads || []).find(l => l.id === overId)?.status === s.label);
    
    if (overStatus) {
      const lead = (leads || []).find(l => l.id === leadId);
      if (lead && lead.status !== overStatus.label) {
        onStatusChange(leadId, overStatus.label);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-250px)]">
        {(statuses || []).map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            leads={(leads || []).filter((l) => l && l.status === status.label)}
            users={users || []}
            statuses={statuses || []}
            onLeadClick={onLeadClick}
            onStatusChange={onStatusChange}
            onRefreshStatuses={onRefreshStatuses}
            onManageStatuses={onManageStatuses}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeId && activeLead ? (
          <LeadCard 
            lead={activeLead} 
            users={users} 
            statuses={statuses}
            onStatusChange={onStatusChange}
            onRefreshStatuses={onRefreshStatuses}
            onManageStatuses={onManageStatuses}
            isOverlay 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

interface KanbanColumnProps {
  status: StatusConfig;
  leads: Lead[];
  users: UserProfile[];
  onLeadClick: (lead: Lead) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps & { 
  statuses: StatusConfig[],
  onStatusChange: (id: string, s: string) => void, 
  onRefreshStatuses?: () => void, 
  onManageStatuses?: () => void 
}> = ({ 
  status, 
  leads, 
  users, 
  statuses,
  onLeadClick, 
  onStatusChange,
  onRefreshStatuses,
  onManageStatuses
}) => {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    blue: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
    purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    red: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  };

  const headerColorMap: Record<string, string> = {
    slate: 'bg-slate-500',
    blue: 'bg-indigo-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    green: 'bg-emerald-500',
    red: 'bg-rose-500',
  };

  return (
    <div className="flex flex-col w-80 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 rounded-[24px] border border-slate-200/50 dark:border-white/5 transition-colors duration-300">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]", headerColorMap[status.color] || 'bg-slate-500')} />
          <h3 className="font-extrabold text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-white">{status.label}</h3>
          <span className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
            {leads.length}
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm border border-transparent hover:border-slate-100">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-hide">
        <SortableContext items={(leads || []).map(l => l.id)} strategy={verticalListSortingStrategy}>
          {(leads || []).map((lead) => (
            <SortableLeadCard 
              key={lead.id} 
              lead={lead} 
              users={users || []} 
              statuses={statuses || []}
              onStatusChange={onStatusChange}
              onRefreshStatuses={onRefreshStatuses}
              onManageStatuses={onManageStatuses}
              onClick={() => onLeadClick(lead)} 
            />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[20px] flex flex-col items-center justify-center text-slate-400 gap-2">
            <Package className="w-6 h-6 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest">No leads</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface SortableLeadCardProps {
  lead: Lead;
  users: UserProfile[];
  statuses: StatusConfig[];
  onStatusChange: (id: string, s: string) => void;
  onRefreshStatuses?: () => void;
  onManageStatuses?: () => void;
  onClick: () => void;
}

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({ 
  lead, 
  users, 
  statuses,
  onStatusChange,
  onRefreshStatuses,
  onManageStatuses,
  onClick 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <LeadCard 
        lead={lead} 
        users={users} 
        statuses={statuses}
        onStatusChange={onStatusChange}
        onRefreshStatuses={onRefreshStatuses}
        onManageStatuses={onManageStatuses}
      />
    </div>
  );
};

interface LeadCardProps {
  lead: Lead;
  users: UserProfile[];
  statuses?: StatusConfig[];
  onStatusChange?: (id: string, s: string) => void;
  onRefreshStatuses?: () => void;
  onManageStatuses?: () => void;
  isOverlay?: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  users, 
  statuses,
  onStatusChange,
  onRefreshStatuses,
  onManageStatuses,
  isOverlay 
}) => {
  const { profile } = useAuth();

  const getFollowUpStatus = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isNaN(date.getTime())) return 'upcoming';
      if (isPast(date) && !isToday(date)) return 'overdue';
      if (isToday(date)) return 'today';
    } catch (e) {
      return 'upcoming';
    }
    return 'upcoming';
  };

  return (
    <Card className={cn(
      "p-5 cursor-grab active:cursor-grabbing border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 shadow-sm rounded-[20px] group",
      isOverlay && "shadow-2xl border-indigo-500 scale-105 rotate-1"
    )}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-[14px] line-clamp-2 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors uppercase">{lead.name}</h4>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-bold tracking-tight bg-slate-50 dark:bg-slate-800/50 w-fit px-2.5 py-1 rounded-lg border border-slate-100/50 dark:border-slate-700/50">
            <Phone className="w-3 h-3 text-emerald-500" />
            {lead.phone}
          </div>
          
          {lead.products && lead.products.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {(lead.products || []).slice(0, 1).map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 truncate tracking-tight">{p?.name || 'Unknown Product'}</span>
                  </div>
                  <Badge className="px-1.5 py-0 h-4 bg-indigo-600 text-white text-[9px] font-black border-none rounded-md">
                    MT
                  </Badge>
                </div>
              ))}
              {(lead.products || []).length > 1 && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">+{(lead.products || []).length - 1} more items</p>
              )}
            </div>
          )}

          {lead.city && (
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">
              <MapPin className="w-3 h-3 text-slate-300" />
              {lead.city}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Avatar className="w-6 h-6 border border-white dark:border-slate-800 shadow-sm">
               <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-black uppercase">
                 {getUserAvatar(lead.assignedTo, users)}
               </AvatarFallback>
             </Avatar>
             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
               {(String(getUserName(lead.assignedTo, users) || 'Member')).split(' ')[0]}
             </span>
          </div>
          {lead.followUpDate && (
            <div className={cn(
              "flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm border",
              getFollowUpStatus(lead.followUpDate) === 'overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
              getFollowUpStatus(lead.followUpDate) === 'today' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            )}>
              <Clock className="w-3 h-3" />
              {(function() {
                try {
                  const date = parseISO(lead.followUpDate!);
                  return isNaN(date.getTime()) ? 'N/A' : format(date, 'MMM d');
                } catch (e) {
                  return 'N/A';
                }
              })()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default KanbanBoard;
