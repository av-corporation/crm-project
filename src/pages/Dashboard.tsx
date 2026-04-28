import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeLeads,
  subscribeActivityLog,
  subscribeStatuses,
  getUsers
} from '../services/crmService';
import { Lead, ActivityLog, StatusConfig, UserProfile } from '../types/crm';
import { getUserName } from '../lib/userUtils';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Target, 
  Calendar,
  Clock,
  TrendingUp,
  Phone,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  ArrowUpRight,
  FileText,
  Plus,
  MessageSquare,
  Activity,
  Zap
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, isToday, parseISO, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { cn } from '../lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

import { motion, AnimatePresence } from 'framer-motion';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [users, setUsers] = useState<UserProfile[]>((window as any).usersList || []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const unsubLeads = subscribeLeads((data) => {
      setLeads(data);
      setIsLoading(false);
    }, profile.role, profile.uid);
    const unsubActivities = subscribeActivityLog(setActivities, profile.role, profile.uid, 10);
    const unsubStatuses = subscribeStatuses(setStatuses);
    getUsers().then(data => data && setUsers(data));
    return () => {
      unsubLeads();
      unsubActivities();
      unsubStatuses();
    };
  }, [profile]);

  useEffect(() => {
    if (activities.length === 0) return;
    
    const missingUids = new Set<string>();
    activities.forEach(a => {
      if (a.userId && !(users || []).find(u => u.uid === a.userId)) {
        missingUids.add(a.userId);
      }
    });

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
  }, [activities, users]);

  // Calculations
  const leadsArray = leads || [];
  const statusArray = statuses || [];
  const usersArray = users || [];

  const totalLeads = leadsArray.length;
  const newLeads = leadsArray.filter(l => l && l.status === 'New').length;
  const inProgressLeads = leadsArray.filter(l => l && ['Contacted', 'Follow-up', 'Qualified'].includes(l.status)).length;
  const closedLeads = leadsArray.filter(l => l && ['Converted', 'Closed'].includes(l.status)).length;
  const hotLeads = leadsArray.filter(l => l && l.priority === 'Hot').length;
  const todayFollowUps = leadsArray.filter(l => {
    if (!l || !l.followUpDate) return false;
    try {
      const d = parseISO(l.followUpDate);
      return !isNaN(d.getTime()) && isToday(d);
    } catch (e) {
      return false;
    }
  }).length;

  // Pie Chart Data
  const statusData = statusArray.map(s => ({
    name: s.label,
    value: leadsArray.filter(l => l && l.status === s.label).length,
    color: s.color === 'slate' ? '#64748b' : 
           s.color === 'blue' ? '#3b82f6' : 
           s.color === 'purple' ? '#a855f7' : 
           s.color === 'orange' ? '#f97316' : 
           s.color === 'green' ? '#22c55e' : 
           s.color === 'amber' ? '#f59e0b' :
           s.color === 'emerald' ? '#10b981' :
           s.color === 'rose' ? '#f43f5e' :
           s.color === 'indigo' ? '#6366f1' :
           s.color === 'red' ? '#ef4444' : '#94a3b8'
  })).filter(d => d.value > 0);

  // Lead Source Data
  const sourceData = Array.from(new Set(leadsArray.map(l => (l && l.source) || 'Other'))).map(source => ({
    name: source,
    value: leadsArray.filter(l => l && (l.source || 'Other') === source).length,
    color: '#6366f1'
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  // Line Chart Data (Last 7 Days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const dailyLeadsData = last7Days.map(day => {
    const count = leadsArray.filter(l => {
      try {
        if (!l || !l.createdAt) return false;
        return startOfDay(parseISO(l.createdAt)).getTime() === startOfDay(day).getTime();
      } catch (e) {
        return false;
      }
    }).length;
    return {
      date: format(day, 'MMM d'),
      leads: count
    };
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back. Here's what's happening with your leads today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all"
            onClick={() => window.location.href = '/leads'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add new lead
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-white dark:bg-slate-900 animate-pulse border border-slate-100 dark:border-white/5" />
            ))
          ) : (
            <>
              <motion.div variants={itemVariants}>
                <Card className="saas-card saas-card-hover p-6 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      <Target className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leads</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalLeads}</h3>
                      <p className="text-[10px] font-bold text-emerald-500 flex items-center">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" /> 12% Growth
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="saas-card saas-card-hover p-6 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{newLeads}</h3>
                      <p className="text-[10px] font-bold text-blue-500 flex items-center">
                        Active pipeline
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="saas-card saas-card-hover p-6 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{todayFollowUps}</h3>
                      <p className="text-[10px] font-bold text-amber-500 flex items-center">
                        Follow-ups
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="saas-card saas-card-hover p-6 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Closed</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{closedLeads}</h3>
                      <p className="text-[10px] font-bold text-emerald-500 flex items-center">
                        Won deals
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="saas-card h-full bg-white dark:bg-slate-900/50 border-none shadow-sm overflow-hidden">
            <CardHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="section-title">Leads Growth</CardTitle>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead acquisition per day</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-none px-3 py-1 font-bold text-[10px]">7 DAYS</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] p-6 pt-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyLeadsData}>
                  <defs>
                    <linearGradient id="colorLeadsBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorLeadsBlue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="saas-card h-full bg-white dark:bg-slate-900/50 border-none shadow-sm">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="section-title">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 px-6 pb-4">
                 {statusData.slice(0, 4).map((s, i) => (
                   <div key={i} className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{s.name}</span>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="saas-card bg-white dark:bg-slate-950 border-none shadow-sm h-full">
            <CardHeader className="p-6 border-b border-slate-50 dark:border-white/5">
              <CardTitle className="section-title">Top Sources</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
               <div className="space-y-4">
                  {sourceData.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-[10px] font-bold uppercase italic">No data available</div>
                  ) : (
                    sourceData.map((source, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                           <span className="text-slate-500">{source.name}</span>
                           <span className="text-indigo-600">{source.value}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }} 
                             animate={{ width: `${(source.value / totalLeads) * 100}%` }}
                             transition={{ duration: 1, delay: 0.5 }}
                             className="h-full bg-indigo-500" 
                           />
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="saas-card bg-white dark:bg-slate-950 border-none shadow-sm h-full">
            <CardHeader className="p-6 border-b border-slate-50 dark:border-white/5">
              <CardTitle className="section-title">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[300px] scrollbar-hide">
               {activities.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-[10px] font-bold uppercase italic">No activity</div>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="p-4 flex gap-4 items-center border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                          {activity.action}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {format(parseISO(activity.createdAt), 'HH:mm')} • {getUserName(activity.userId, users, profile)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="saas-card bg-white dark:bg-indigo-600 p-6 flex flex-col justify-between h-full border-none shadow-xl shadow-indigo-600/20 text-indigo-950 dark:text-white overflow-hidden relative group">
             <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                   <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h3 className="text-xl font-black tracking-tight leading-tight">Ready to expand your reach?</h3>
                   <p className="text-xs font-bold opacity-70 mt-2">New lead generation campaigns are active. Review your sales script.</p>
                </div>
             </div>
             <Button className="w-full mt-6 h-12 bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase text-[10px] tracking-[0.2em] rounded-xl relative z-10 active:scale-95 transition-all">
                Update Script
             </Button>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
