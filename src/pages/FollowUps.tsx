import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeLeads, 
  updateLead, 
  subscribeLeadActivityLogs,
  subscribeTasks,
  updateTaskStatus
} from '../services/crmService';
import { Lead, ActivityLog, Task } from '../types/crm';
import { 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Calendar, 
  User, 
  Tag, 
  Clock,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import FollowUpCalendar from '../components/FollowUpCalendar';
import { isSameDay } from 'date-fns';

import { motion, AnimatePresence } from 'framer-motion';

const FollowUps: React.FC = () => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leadActivities, setLeadActivities] = useState<Record<string, ActivityLog[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'pending' | 'date'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!profile) return;
    const unsubLeads = subscribeLeads(setLeads, profile.role, profile.uid);
    const unsubTasks = subscribeTasks(setTasks, profile.role, profile.uid);
    return () => {
      unsubLeads();
      unsubTasks();
    };
  }, [profile]);

  useEffect(() => {
    // Fetch activities for leads that might have follow-ups
    leads.forEach(lead => {
      if (!leadActivities[lead.id]) {
        subscribeLeadActivityLogs(lead.id, (activities) => {
          setLeadActivities(prev => ({ ...prev, [lead.id]: activities }));
        });
      }
    });
  }, [leads]);

  const combinedFollowUps = [
    ...(leads || []).filter(l => !!l.followUpDate).map(l => ({
      id: l.id,
      type: 'lead' as const,
      leadId: l.id,
      name: l.name,
      phone: l.phone,
      product: l.product,
      date: l.followUpDate!,
      title: 'General Follow-up',
      original: l
    })),
    ...(tasks || []).filter(t => t.taskStatus === 'pending' && !!t.dueDate).map(t => {
      const lead = (leads || []).find(l => l.id === t.leadId);
      return {
        id: t.id,
        type: 'task' as const,
        leadId: t.leadId,
        name: lead?.name || 'Unknown Lead',
        phone: lead?.phone || '',
        product: lead?.product || '',
        date: t.dueDate!,
        title: t.taskTitle,
        original: t
      };
    })
  ].sort((a, b) => {
    try {
      const dateA = parseISO(a.date).getTime();
      const dateB = parseISO(b.date).getTime();
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateA - dateB;
    } catch (e) {
      return 0;
    }
  });

  const filteredFollowUps = combinedFollowUps.filter(item => {
    // Filter by search term
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.phone.includes(searchTerm) ||
                         item.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Filter by date status
    if (filter === 'today') {
      try {
        const d = parseISO(item.date);
        return !isNaN(d.getTime()) && isToday(d);
      } catch (e) { return false; }
    }
    if (filter === 'overdue') {
      try {
        const d = parseISO(item.date);
        return !isNaN(d.getTime()) && isPast(d) && !isToday(d);
      } catch (e) { return false; }
    }
    if (filter === 'date' && selectedDate) {
      try {
        const d = parseISO(item.date);
        return !isNaN(d.getTime()) && isSameDay(d, selectedDate);
      } catch (e) { return false; }
    }
    
    return true;
  });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setFilter('date');
  };

  const handleMarkDone = async (item: any) => {
    try {
      if (item.type === 'lead') {
        await updateLead(item.id, { followUpDate: null as any });
      } else {
        await updateTaskStatus(item.id, 'completed');
      }
      toast.success('Follow-up marked as completed');
    } catch (error) {
      toast.error('Failed to update follow-up');
    }
  };

  const handleWhatsApp = (lead: Lead) => {
    const activities = leadActivities[lead.id] || [];
    const lastNote = activities.find(a => (a.action || '').includes('note'));
    const noteText = lastNote ? lastNote.action : "Following up regarding our previous discussion.";
    const msg = `Hi ${lead.name},\n${noteText}`;
    
    navigator.clipboard.writeText(msg);
    toast.success('Message copied. Redirecting to WhatsApp...');
    
    const url = `https://api.whatsapp.com/send?phone=91${lead.phone}&text=${encodeURIComponent(msg)}`;
    window.top.location.href = url;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-light tracking-tight text-slate-900 dark:text-white font-serif italic">Operational Matrix</h2>
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-70">Scheduled Engagements • Sector Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search Coordinates..." 
              className="input-standard pl-12 w-64 bg-white/40 dark:bg-slate-950/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 h-10">
            {(['all', 'today', 'overdue'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all",
                  filter === f 
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <FollowUpCalendar leads={leads} onDateClick={handleDateClick} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="glass-card p-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Sector Analytics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-indigo-500/5">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Pipeline</span>
                  <Badge className="bg-indigo-600 text-white font-black text-[10px] rounded-lg border-none">{combinedFollowUps.length}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-500/10">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Due Today</span>
                  <Badge className="bg-amber-500 text-white font-black text-[10px] rounded-lg border-none shadow-lg shadow-amber-500/20">{(combinedFollowUps || []).filter(i => i && i.date && (function() { try { return isToday(parseISO(i.date)); } catch(e) { return false; } })()).length}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-500/10">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Overdue Status</span>
                  <Badge className="bg-rose-500 text-white font-black text-[10px] rounded-lg border-none shadow-lg shadow-rose-500/20">{(combinedFollowUps || []).filter(i => i && i.date && (function() { try { return isPast(parseISO(i.date)) && !isToday(parseISO(i.date)); } catch(e) { return false; } })()).length}</Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Follow-up List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {filter === 'date' && selectedDate ? `Follow-ups for ${format(selectedDate, 'MMMM d, yyyy')}` : 
               filter === 'today' ? "Today's Follow-ups" :
               filter === 'overdue' ? "Overdue Follow-ups" : "All Follow-ups"}
            </h3>
            {filter !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setFilter('all')} className="text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                Clear Filters
              </Button>
            )}
          </div>

          {filteredFollowUps.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card border-none p-20 text-center"
            >
              <div className="w-20 h-20 bg-indigo-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-indigo-300 dark:text-indigo-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Mission Accomplished</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2 uppercase tracking-tighter">No pending follow-ups in the active sector.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredFollowUps.map((item, idx) => {
                  const activities = leadActivities[item.leadId] || [];
                  const lastNote = item.type === 'task' ? item.title : (activities.find(a => (a.action || '').includes('note'))?.action || 'No notes yet');
                  const isOverdue = (function() {
                    try { return isPast(parseISO(item.date)) && !isToday(parseISO(item.date)); }
                    catch (e) { return false; }
                  })();
                  
                  const isTodayItem = (function() {
                    try { return isToday(parseISO(item.date)); }
                    catch (e) { return false; }
                  })();
                  
                  return (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.002, x: 4 }}
                    >
                      <div className={cn(
                        "glass-card group p-6 transition-all border-l-4",
                        isOverdue ? "border-l-rose-500" : "border-l-indigo-500"
                      )}>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex items-start gap-5 flex-1 min-w-0">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                              <User className="w-7 h-7" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-tight truncate">{item.name}</h4>
                                <div className="flex gap-2">
                                  {isOverdue && (
                                    <Badge className="bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border-none shadow-[0_0_12px_rgba(244,63,94,0.3)]">Immediate</Badge>
                                  )}
                                  {isTodayItem && (
                                    <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border-none shadow-[0_0_12px_rgba(245,158,11,0.3)]">Today</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                                <div className="flex items-center gap-1.5">
                                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                                  {item.product || 'Classified'}
                                </div>
                                <div className={cn(
                                  "flex items-center gap-1.5",
                                  isOverdue ? "text-rose-500" : "text-indigo-600"
                                )}>
                                  <Clock className="w-3.5 h-3.5" />
                                  {item.date ? (function() {
                                    try { return format(parseISO(item.date), 'MMM d, h:mm a'); }
                                    catch (e) { return 'Invalid Date'; }
                                  })() : 'No Date'}
                                </div>
                              </div>
                            </div>
                          </div>
  
                          <div className="flex-1 lg:max-w-[300px] glass-card bg-indigo-50/10 dark:bg-white/5 p-4 border-none shadow-none group-hover:bg-indigo-50/20 transition-all">
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic font-medium leading-relaxed">
                              "{lastNote}"
                            </p>
                          </div>
  
                          <div className="flex items-center gap-2 shrink-0">
                            <Button 
                              size="icon"
                              variant="ghost"
                              className="w-11 h-11 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-white/5 active:scale-90 transition-all"
                              onClick={() => window.location.href = `tel:${item.phone}`}
                            >
                              <Phone className="w-5 h-5" />
                            </Button>
                            <Button 
                              size="icon"
                              variant="ghost"
                              className="w-11 h-11 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-white/5 active:scale-90 transition-all"
                              onClick={() => {
                                const msg = `Hi ${item.name}, following up regarding ${item.title}`;
                                window.top.location.href = `https://api.whatsapp.com/send?phone=91${item.phone}&text=${encodeURIComponent(msg)}`;
                              }}
                            >
                              <MessageCircle className="w-5 h-5" />
                            </Button>
                            <Button 
                              className="btn-primary h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-[0.98]"
                              onClick={() => handleMarkDone(item)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              COMPLETE
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowUps;
