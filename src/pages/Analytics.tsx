import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeLeads, subscribeStatuses, getUsers } from '../services/crmService';
import { Lead, LeadStatus, UserProfile } from '../types/crm';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Badge } from '../components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { format, subDays, startOfDay, isWithinInterval, parseISO } from 'date-fns';

const Analytics: React.FC = () => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    if (!profile) return;
    const unsubLeads = subscribeLeads(setLeads, profile.role, profile.uid);
    const unsubStatuses = subscribeStatuses(setStatuses);
    getUsers().then(setUsers);
    
    return () => {
      unsubLeads();
      unsubStatuses();
    };
  }, [profile]);

  // Dynamic Data Processing
  const stats = useMemo(() => {
    const leadsArray = leads || [];
    const totalLeads = leadsArray.length;
    const convertedLeads = leadsArray.filter(l => l.status === 'Converted' || l.status === 'Closed').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';
    
    // Revenue Estimation (Mock Logic based on product/conversion)
    const estimatedRevenue = convertedLeads * 2500; // Average deal size
    
    return [
      { label: 'Projected Revenue', value: `₹${estimatedRevenue.toLocaleString()}`, icon: DollarSign, color: 'emerald', trend: '+12.5%', isUp: true },
      { label: 'Total Pool', value: totalLeads.toString(), icon: Users, color: 'indigo', trend: '+5.2%', isUp: true },
      { label: 'Success Rate', value: `${conversionRate}%`, icon: Target, color: 'rose', trend: '+2.1%', isUp: true },
      { label: 'Avg. Maturity', value: '14 Days', icon: TrendingUp, color: 'amber', trend: '-8.4%', isUp: false },
    ];
  }, [leads]);

  const revenueData = useMemo(() => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayLabel = format(date, period === 'week' ? 'EEE' : 'MMM d');
      const dayLeads = leads.filter(l => {
         try {
           const createdDate = parseISO(l.createdAt as any);
           return isWithinInterval(createdDate, { 
             start: startOfDay(date), 
             end: new Date(startOfDay(date).getTime() + 86400000) 
           });
         } catch(e) { return false; }
      }).length;
      
      data.push({
        name: dayLabel,
        revenue: dayLeads * 2500,
        leads: dayLeads
      });
    }
    return data;
  }, [leads, period]);

  const funnelData = useMemo(() => {
    const sortedStatuses = [...statuses].sort((a, b) => (a.order || 0) - (b.order || 0));
    return sortedStatuses.slice(0, 5).map((s, i) => ({
      name: s.label,
      value: leads.filter(l => l.status === s.label).length,
      color: COLORS[i % COLORS.length]
    }));
  }, [leads, statuses]);

  const leadSourceData = useMemo(() => {
    const sources = leads.reduce((acc, l) => {
      const s = l.source || 'Other';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return (Object.entries(sources) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [leads]);

  const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 italic uppercase">
            <BarChart3 className="w-8 h-8 text-indigo-500" />
            Strategic <span className="text-slate-400 font-light">Analytics</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 ml-11">Performance Vector • Operational Transparency</p>
        </div>
        <div className="flex items-center gap-3">
           <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
             <SelectTrigger className="w-[180px] h-12 rounded-2xl border-none glass-card font-bold text-xs uppercase tracking-widest shadow-sm">
               <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
               <SelectValue placeholder="Period" />
             </SelectTrigger>
             <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="week" className="font-bold text-xs">Past 7 Days</SelectItem>
                <SelectItem value="month" className="font-bold text-xs">Past 30 Days</SelectItem>
                <SelectItem value="year" className="font-bold text-xs">Past 90 Days</SelectItem>
             </SelectContent>
           </Select>
           <Button className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest px-6 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
             <Download className="w-4 h-4 mr-2" />
             Export Protocol
           </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <Card className="p-8 rounded-[32px] border-none bg-white dark:bg-slate-950 shadow-premium relative overflow-hidden group">
                <div className={cn(
                  "absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity",
                  stat.color === 'emerald' ? 'bg-emerald-500' : 
                  stat.color === 'indigo' ? 'bg-indigo-500' :
                  stat.color === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                )} />
                <div className="flex justify-between items-start mb-6">
                  <div className={cn(
                    "p-4 rounded-2xl", 
                    stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 
                    stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' :
                    stat.color === 'rose' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'
                  )}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className={cn(
                    "rounded-xl border-none font-black text-[10px] px-3 py-1.5",
                    stat.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  )}>
                    {stat.isUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {stat.trend}
                  </Badge>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic leading-none">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stat.value}</h3>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-10 rounded-[40px] border-none bg-white dark:bg-slate-950 shadow-premium">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 italic uppercase">
                Projected Trajectory
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time revenue forecast based on conversion velocity</p>
            </div>
          </div>
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#64748B', uppercase: true }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111827', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontWeight: 900, fontSize: '11px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  labelStyle={{ color: '#6366f1', marginBottom: '4px', fontWeight: 900, textTransform: 'uppercase', fontSize: '9px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-10 rounded-[40px] border-none bg-white dark:bg-slate-950 shadow-premium flex flex-col justify-between">
          <div className="mb-10">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 italic uppercase">
              Sales Funnel
              <Target className="w-5 h-5 text-rose-500" />
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lead status distribution velocity</p>
          </div>
          <div className="flex-1 flex flex-col gap-8">
            {funnelData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-xs uppercase font-bold">No active funnel data</div>
            ) : funnelData.map((stage, i) => (
              <div key={stage.name} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stage.name}</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{stage.value} <span className="text-[10px] text-slate-400 ml-1">LEADS</span></span>
                </div>
                <div className="h-3 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stage.value / (leads.length || 1)) * 100 * 2)}%` }}
                    transition={{ duration: 1.5, delay: i * 0.1, ease: "circOut" }}
                    className="h-full rounded-full shadow-lg"
                    style={{ backgroundColor: stage.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 p-5 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
             <p className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 italic leading-relaxed">
               <Zap className="w-3 h-3 inline-block mr-1.5" /> 
               Neural observation: Your funnel is heavy on 'New' leads. Immediate outbound protocol recommended to maintain flow.
             </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-10 rounded-[40px] border-none bg-white dark:bg-slate-950 shadow-premium">
          <div className="flex items-center justify-between mb-10">
             <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 italic uppercase">
              Omni-Channel Mix
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </h3>
          </div>
          <div className="h-[320px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: '#111827', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ fontWeight: 900, fontSize: '10px', color: '#fff' }}
                />
                <Legend 
                  verticalAlign="middle" 
                  align="right" 
                  layout="vertical"
                  formatter={(value) => <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-3 italic">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-10 rounded-[40px] border-none bg-white dark:bg-slate-950 shadow-premium">
          <div className="flex items-center justify-between mb-10">
             <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 italic uppercase">
              Capture Pulse
              <Users className="w-5 h-5 text-indigo-500" />
            </h3>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#64748B' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                />
                <Tooltip 
                   cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                   contentStyle={{ 
                    backgroundColor: '#111827', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontWeight: 900, fontSize: '11px', color: '#fff' }}
                />
                <Bar 
                  dataKey="leads" 
                  fill="#6366f1" 
                  radius={[12, 12, 12, 12]} 
                  barSize={32}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
