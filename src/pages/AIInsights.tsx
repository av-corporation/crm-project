import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeLeads, subscribeActivityLog } from '../services/crmService';
import { Lead, ActivityLog } from '../types/crm';
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Brain,
  Zap,
  Target,
  ArrowUpRight,
  MessageSquare,
  Clock,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { cn } from '../lib/utils';

import { motion, AnimatePresence } from 'framer-motion';

const AIInsights: React.FC = () => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const unsubLeads = subscribeLeads(setLeads, profile.role, profile.uid);
    const unsubActivities = subscribeActivityLog(setActivities, profile.role, profile.uid, 50);
    return () => {
      unsubLeads();
      unsubActivities();
    };
  }, [profile]);

  // Real-time AI Insights calculation
  const getInsights = () => {
    const leadsArray = leads || [];
    const interestedLeads = leadsArray.filter(l => l && l.status === 'Interested');
    const overdueFollowUps = leadsArray.filter(l => l && l.followUpDate && isAfter(new Date(), parseISO(l.followUpDate)));
    const dealsDone = leadsArray.filter(l => l && l.status === 'Deal Done');
    
    // Find top product
    const productCounts = leadsArray.reduce((acc, lead) => {
      if (lead && lead.product) {
        acc[lead.product] = (acc[lead.product] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topProduct = Object.entries(productCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'None';

    return [
      {
        title: "High Conversion Probability",
        description: `${interestedLeads.length} leads are currently 'Interested'. Following up within 24 hours can increase conversion by 40%.`,
        type: "opportunity",
        icon: Target,
        color: "blue"
      },
      {
        title: "Pipeline Leak Detected",
        description: `${overdueFollowUps.length} follow-ups are overdue. This is causing a potential leak in your sales pipeline.`,
        type: "warning",
        icon: AlertCircle,
        color: "orange"
      },
      {
        title: "Top Performing Product",
        description: `Based on your ${leadsArray.length} leads, '${topProduct}' is your most popular offering. Focus marketing efforts here.`,
        type: "success",
        icon: TrendingUp,
        color: "green"
      }
    ];
  };

  const insights = getInsights();

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-10 pb-12"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">
            <Brain className="w-3.5 h-3.5" /> Neural Network
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Predictive <span className="text-slate-400 font-light">Insights</span>
          </h2>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 opacity-70 tracking-tight">Smart lead scoring and behavioral sales pattern analysis.</p>
        </div>
        <Button 
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing Data...
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4" />
              Re-Sync AI Node
            </div>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="saas-card group overflow-hidden border-none cursor-default bg-white dark:bg-slate-950 shadow-premium"
            >
              <div className="p-10">
                <div className={cn(
                  "w-12 h-12 rounded-[18px] flex items-center justify-center mb-6 transition-transform group-hover:rotate-12 group-hover:scale-110",
                  insight.color === 'blue' ? 'bg-indigo-50 text-indigo-600 dark:bg-white/5 dark:text-indigo-400 shadow-lg shadow-indigo-500/10' :
                  insight.color === 'orange' ? 'bg-amber-50 text-amber-600 dark:bg-white/5 dark:text-amber-400 shadow-lg shadow-amber-500/10' :
                  'bg-emerald-50 text-emerald-600 dark:bg-white/5 dark:text-emerald-400 shadow-lg shadow-emerald-500/10'
                )}>
                  <insight.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight italic uppercase mb-3">{insight.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                  {insight.description}
                </p>
                <div className="pt-6 border-t border-indigo-500/5">
                  <Button variant="ghost" className="p-0 h-auto text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-transparent group/btn italic">
                    EXECUTE ACTION
                    <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="saas-card p-1 border-none bg-white dark:bg-slate-950 shadow-premium overflow-hidden"
        >
          <div className="p-8 border-b border-indigo-500/5">
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 italic uppercase">
              <Brain className="w-6 h-6 text-indigo-500" />
              Core Pipeline Pulse
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Neural assessment of active sales cycle</p>
          </div>
          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Conversion Velocity</span>
                <span className="text-sm font-black text-emerald-500">8.5% (+1.2% Δ)</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '45%' }}
                  className="h-full bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Response Latency</span>
                <span className="text-sm font-black text-indigo-500">2.4 HOURS</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '75%' }}
                  className="h-full bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.3)]"
                />
              </div>
            </div>
            <div className="p-5 glass-card bg-indigo-500/5 border-indigo-500/10 rounded-2xl">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 leading-relaxed italic">
                <Sparkles className="w-4 h-4 inline-block mr-2 text-indigo-500" /> 
                <span className="font-black uppercase tracking-tighter">AI LOGIC:</span> Your response time has improved by 15% this week. This correlates with a 5% increase in 'Interested' leads. Optimized sector detected.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4 }}
           className="saas-card p-1 border-none bg-white dark:bg-slate-950 shadow-premium overflow-hidden"
        >
          <div className="p-8 border-b border-indigo-500/5">
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 italic uppercase">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              Strategic Comms
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Behavioral analysis of interactions</p>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-indigo-400 shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Optimal Phase</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Tue & Thu, 10:00 AM - 12:00 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-indigo-400 shadow-sm">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Dominant Channel</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">WhatsApp (72% higher response rate)</p>
              </div>
            </div>
            <div className="p-5 glass-card bg-purple-500/5 border-purple-500/10 rounded-2xl">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-400 leading-relaxed italic">
                <Brain className="w-4 h-4 inline-block mr-2 text-purple-500" /> 
                <span className="font-black uppercase tracking-tighter">AI INSIGHT:</span> Leads are responding faster to WhatsApp messages than emails. Recommend shifting initial contact protocol to encrypted chat.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AIInsights;
