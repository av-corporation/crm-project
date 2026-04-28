import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  ChevronLeft,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  Zap,
  Clock,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { 
  subscribeLeads, 
  restoreLead, 
  deleteLead 
} from '../services/crmService';
import { Lead } from '../types/crm';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog';
import { cn } from '../lib/utils';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

const RecycleBin: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
       navigate('/');
       return;
    }

    const unsubscribe = subscribeLeads((data) => {
      setLeads(data);
      setLoading(false);
    }, profile.role, profile.uid, true);

    return () => unsubscribe();
  }, [profile]);

  const filteredLeads = (leads || []).filter(l => 
    l && (
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleRestore = async () => {
    if (!selectedLead) return;
    try {
      await restoreLead(selectedLead.id);
      toast.success('Lead restored successfully');
      setIsRestoreOpen(false);
    } catch (error) {
      toast.error('Failed to restore lead');
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedLead) return;
    try {
      await deleteLead(selectedLead.id, true);
      toast.success('Lead permanently deleted');
      setIsDeleteOpen(false);
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#111827] dark:text-white tracking-tight flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-rose-500" />
            Recycle Bin
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Restore or permanently delete archived leads</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="ghost" onClick={() => navigate('/leads')} className="rounded-xl font-bold">
             <ChevronLeft className="w-4 h-4 mr-2" />
             Back to Leads
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <Card className="p-6 bg-rose-500/5 border-rose-500/10 rounded-3xl">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <AlertTriangle className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest">Archive Size</p>
                  <p className="text-2xl font-black text-rose-600">{(leads || []).length} Records</p>
               </div>
            </div>
         </Card>
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center mb-8">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search archived leads..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 rounded-3xl bg-slate-100 animate-pulse" />)
        ) : filteredLeads.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredLeads.map((lead) => (
                <motion.div
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-rose-500/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    {(() => {
                      const isCompany = !!lead.companyName && lead.companyName.trim().length > 0;
                      const primaryName = isCompany ? lead.companyName : (lead.name || 'No Name');
                      
                      return (
                        <>
                          <Avatar className="w-14 h-14 rounded-2xl border-2 border-white/50 shadow-sm">
                            <AvatarFallback className="premium-gradient text-white font-black">
                              {(String(primaryName || '??')).split(' ').filter(Boolean).map(n => n[0] || '').join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{primaryName}</h3>
                              <Badge variant="outline" className={cn(
                                "text-[9px] px-1.5 py-0 h-4 font-bold uppercase tracking-widest",
                                isCompany ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "text-slate-400 border-slate-100"
                              )}>
                                {isCompany ? 'Company' : 'Individual'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 underline-offset-4 decoration-indigo-500/30">
                              <span className="text-xs font-medium text-slate-500">{lead.phone || 'No Phone'}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {lead.deletedAt ? (function() {
                                  try { return format(parseISO(lead.deletedAt), 'MMM d, h:mm a'); }
                                  catch (e) { return 'Invalid Date'; }
                                })() : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => { setSelectedLead(lead); setIsRestoreOpen(true); }}
                      className="rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white px-6 h-10 shadow-lg shadow-emerald-500/20"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => { setSelectedLead(lead); setIsDeleteOpen(true); }}
                      className="rounded-xl font-black text-[10px] uppercase tracking-widest border-rose-100 hover:bg-rose-50 text-rose-500 px-6 h-10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Forever
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-20 text-center glass-card border-none bg-slate-50/50">
            <Trash2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Recycle bin is empty</h3>
            <p className="text-slate-400 mt-2">Any leads you delete will appear here for 30 days.</p>
          </div>
        )}
      </div>

      {/* Restore Dialog */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8">
          <DialogHeader className="pt-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
              <RotateCcw className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-black">Restore lead?</DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-500 pt-2 leading-relaxed">
              Are you sure you want to restore <span className="text-slate-900 font-black">"{selectedLead?.name}"</span>? It will be moved back to your active leads list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-8">
            <Button variant="ghost" onClick={() => setIsRestoreOpen(false)} className="rounded-2xl font-bold h-12 flex-1">Keep Archived</Button>
            <Button onClick={handleRestore} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs tracking-widest h-12 flex-1 shadow-xl shadow-emerald-600/20">Restore Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8">
          <DialogHeader className="pt-2">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600 mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-black">Permanent Deletion?</DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-500 pt-2 leading-relaxed text-rose-600 italic">
               Warning: This action is final. You will not be able to recover this lead record once deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-8">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="rounded-2xl font-bold h-12 flex-1">Safe Exit</Button>
            <Button onClick={handlePermanentDelete} className="rounded-2xl bg-rose-600 hover:bg-rose-700 font-black uppercase text-xs tracking-widest h-12 flex-1 shadow-xl shadow-rose-600/20">Permanent Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecycleBin;
