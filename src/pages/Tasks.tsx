import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeTasks, 
  updateTaskStatus, 
  subscribeLeads,
  getUsers
} from '../services/crmService';
import { Task, Lead, UserProfile } from '../types/crm';
import { getUserName, getUserAvatar } from '../lib/userUtils';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter,
  Plus,
  User,
  Calendar,
  MoreVertical,
  Trash2,
  CheckCircle2,
  X
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { deleteTasksBulk } from '../services/crmService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import TaskBoard from '../components/TaskBoard';
import { LayoutGrid, List as ListIcon } from 'lucide-react';

const Tasks: React.FC = () => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserProfile[]>((window as any).usersList || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const unsubTasks = subscribeTasks(setTasks, profile.role, profile.uid);
    const unsubLeads = subscribeLeads(setLeads, profile.role, profile.uid);
    getUsers().then(setUsers);
    
    return () => {
      unsubTasks();
      unsubLeads();
    };
  }, [profile]);

  useEffect(() => {
    if (tasks.length === 0) return;
    
    const missingUids = new Set<string>();
    if (missingUids.size > 0) {
      const fetchMissing = async () => {
        try {
          const snaps = await Promise.all(Array.from(missingUids).map(uid => getDoc(doc(db, 'users', uid))));
          const newUsers = snaps.filter(s => s.exists()).map(s => ({ uid: s.id, ...s.data() } as UserProfile));
          if (newUsers.length > 0) {
            setUsers(prev => {
              const prevArray = prev || [];
              const existingUids = new Set(prevArray.map(u => u.uid));
              const filteredNew = (newUsers || []).filter(u => u && u.uid && !existingUids.has(u.uid));
              if (filteredNew.length === 0) return prevArray;
              return [...prevArray, ...filteredNew];
            });
          }
        } catch (err) {
          console.error("Error fetching missing users:", err);
        }
      };
      fetchMissing();
    }
  }, [tasks, users]);

  const filteredTasks = (tasks || []).filter(task => {
    const lead = (leads || []).find(l => l.id === task.leadId);
    const matchesSearch = (task.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    if (!matchesSearch) return false;

    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'overdue') return task.status === 'pending' && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
    
    return true;
  });

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      await updateTaskStatus(task.id, newStatus);
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleToggleSelectTask = (taskId: string) => {
    setSelectedTaskIds(prev => 
      (prev || []).includes(taskId) ? (prev || []).filter(id => id !== taskId) : [...(prev || []), taskId]
    );
  };

  const handleToggleSelectAll = () => {
    const fTasks = (filteredTasks || []);
    if (selectedTaskIds.length === fTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(fTasks.map(t => t.id));
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      await deleteTasksBulk(selectedTaskIds);
      toast.success(`${selectedTaskIds.length} tasks deleted`);
      setSelectedTaskIds([]);
      setIsBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete tasks');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">
            <CheckSquare className="w-3.5 h-3.5" /> Operations
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Mission <span className="text-slate-400 font-light">Control</span></h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 opacity-70 tracking-tight">Manage your tactical daily execution and task queue.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {selectedTaskIds.length > 0 && (
            <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-2 rounded-xl">{selectedTaskIds.length} Selected</span>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                className="h-11 rounded-xl px-5 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/10 active:scale-[0.98] transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Flush Selection
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
              <Input 
                placeholder="Search missions..." 
                className="h-12 pl-12 w-64 rounded-2xl border-none bg-white dark:bg-slate-900 shadow-sm font-bold text-sm focus:ring-2 focus:ring-indigo-500/10 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl h-12 border border-slate-100 dark:border-white/5 shadow-inner">
              {(['all', 'pending', 'overdue'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-6 h-full text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    filter === f 
                      ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-md scale-105" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl h-12 border border-slate-100 dark:border-white/5 shadow-inner ml-2">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-4 h-full rounded-xl transition-all",
                  viewMode === 'list' 
                    ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-md" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={cn(
                  "px-4 h-full rounded-xl transition-all",
                  viewMode === 'board' 
                    ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-md" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 gap-6"
          >
            {filteredTasks.length === 0 ? (
              <div className="saas-card border-none py-24 text-center bg-white/40 dark:bg-slate-900/40">
                <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckSquare className="w-10 h-10 text-indigo-200 dark:text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System Clear</h3>
                <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto mt-3 uppercase tracking-tighter opacity-60">You have no active missions matching this filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {filteredTasks.map((task, idx) => {
                  const lead = (leads || []).find(l => l.id === task.leadId);
                  const isOverdue = task.status === 'pending' && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
                  
                  return (
                    <motion.div 
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
                      className={cn(
                        "saas-card p-1 group border-slate-100 hover:border-indigo-500/20 transition-all duration-300",
                        task.status === 'completed' && "opacity-50 grayscale-[0.8]",
                        selectedTaskIds.includes(task.id) && "border-indigo-500/40 ring-4 ring-indigo-500/5"
                      )}
                      onClick={() => handleToggleSelectTask(task.id)}
                    >
                      <div className="p-6 lg:px-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                         {/* Background Accent */}
                        <div className={cn(
                          "absolute top-0 right-0 w-1 h-full",
                          task.priority === 'High' ? 'bg-rose-500' : 
                          task.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        )} />

                        <div className="flex items-center gap-8 min-w-0 flex-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(task);
                            }}
                            className={cn(
                              "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all shrink-0 border border-slate-100 dark:border-white/5 shadow-premium group/box grow-0",
                              task.status === 'completed' 
                                ? "bg-emerald-600 border-transparent text-white" 
                                : "bg-white dark:bg-slate-900 text-slate-300 hover:scale-105 active:scale-95"
                            )}
                          >
                            {task.status === 'completed' ? <CheckCircle2 className="w-8 h-8" /> : <div className="w-8 h-8 rounded-lg border-2 border-slate-200 dark:border-white/20 group-hover/box:border-indigo-500 transition-colors" />}
                          </button>
    
                          <div className="space-y-2.5 min-w-0 flex-1">
                            <div className="flex items-center gap-4 flex-wrap">
                              <h4 className={cn(
                                "text-xl font-black tracking-tight",
                                task.status === 'completed' ? "line-through text-slate-400" : "text-slate-900 dark:text-white"
                              )}>
                                {task.title}
                              </h4>
                              <div className="flex gap-2">
                                {isOverdue && (
                                  <Badge className="bg-rose-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg">Overdue</Badge>
                                )}
                                <Badge className={cn(
                                  "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg",
                                  task.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                  task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                )} variant="outline">
                                  {task.priority} Priority
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                              <div className="flex items-center gap-3">
                                 <div className="flex -space-x-2">
                                    <Avatar className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
                                      <AvatarFallback className="bg-indigo-600 text-white text-[9px] font-black">{lead?.name?.slice(0, 1)}</AvatarFallback>
                                    </Avatar>
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Associated Profile</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight group-hover:text-indigo-600 transition-colors">{lead?.name || 'Unlinked Profile'}</span>
                                 </div>
                              </div>
    
                              <div className="flex items-center gap-3 pl-8 border-l border-slate-100 dark:border-white/5">
                                 <Clock className={cn("w-4 h-4", isOverdue ? "text-rose-500" : "text-indigo-500")} />
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Deadline</span>
                                    <span className={cn("text-xs font-bold uppercase tracking-tight", isOverdue ? "text-rose-600" : "text-slate-600 dark:text-slate-400")}>
                                      {task.dueDate ? format(parseISO(task.dueDate), 'MMM d, h:mm a') : 'No Date'}
                                    </span>
                                 </div>
                              </div>
                            </div>
                          </div>
                        </div>
    
                        <div className="flex items-center gap-4 shrink-0">
                          <Button 
                            variant="ghost"
                            className="h-12 px-6 rounded-2xl bg-slate-50 dark:bg-slate-900 font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/leads?id=${task.leadId}`;
                            }}
                          >
                            View Context
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              }
                            >
                              <MoreVertical className="w-5 h-5 text-slate-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl border-none shadow-3xl bg-white dark:bg-slate-900">
                               <DropdownMenuGroup>
                                 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }} className="gap-3 font-bold py-3 px-4 rounded-xl cursor-pointer">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                                  {task.status === 'pending' ? 'Mark Task Done' : 'Revert to Pending'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-slate-50 dark:bg-white/5" />
                                <DropdownMenuItem className="gap-3 text-rose-500 font-bold py-3 px-4 rounded-xl cursor-pointer focus:bg-rose-50 focus:text-rose-600">
                                  <Trash2 className="w-4 h-4" /> Purge Mission
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="board"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <TaskBoard 
              tasks={filteredTasks}
              leads={leads}
              users={users}
              onTaskClick={(task) => {}} 
              onStatusChange={(taskId, newStatus) => {
                updateTaskStatus(taskId, newStatus);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bulk Actions */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-[#111827] dark:bg-indigo-600 text-white px-8 py-4 rounded-[32px] shadow-2xl shadow-indigo-500/30 flex items-center gap-8 border border-white/10 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Actions Pending</span>
              <span className="text-sm font-black italic">{selectedTaskIds.length} ITEMS SELECTED</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleToggleSelectAll}
                className="h-11 bg-white/10 hover:bg-white/20 text-white rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest border border-white/5"
              >
                {selectedTaskIds.length === filteredTasks.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                className="h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-500/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Flush Selection
              </Button>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setSelectedTaskIds([])}
              className="w-11 h-11 rounded-2xl hover:bg-white/10 text-white/60"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 mb-2">
              <AlertCircle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">
              ARE YOU SURE?
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed">
              This will permanently delete <span className="text-rose-600">{selectedTaskIds.length} selected tasks</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex gap-3 sm:justify-start">
            <Button 
              variant="ghost" 
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteSelected}
              className="flex-[2] h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all active:scale-[0.98]"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
