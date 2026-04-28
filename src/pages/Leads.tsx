import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MapPin, 
  Map,
  Calendar,
  MessageSquare,
  ChevronRight,
  Trash2,
  User as UserIcon,
  AlertCircle,
  History,
  X,
  ArrowLeft,
  LayoutDashboard,
  Paperclip,
  ClipboardPaste,
  Clipboard,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Tag,
  FileText,
  MessageCircle,
  LayoutGrid,
  List as ListIcon,
  Clock,
  MoreVertical,
  ChevronLeft,
  ArrowUpDown,
  Download,
  Upload,
  Edit2,
  Users,
  Zap,
  Target,
  Activity,
  UserPlus,
  TrendingUp,
  Database,
  Copy,
  ExternalLink,
  Check,
  Loader2,
  Building2,
  Settings,
  MoreHorizontal,
  CheckCircle,
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  Bell,
  Sparkles,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import KanbanBoard from '../components/KanbanBoard';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeLeads, 
  createLead, 
  updateLead, 
  deleteLead,
  deleteLeadsBulk,
  cleanupLeadsData,
  subscribeLeadNotes,
  addNote,
  updateNote,
  deleteNote,
  logActivity,
  subscribeActivityLog,
  checkLeadExistsByPhone,
  subscribeProducts,
  createProduct,
  seedProducts,
  cleanProductName,
  deleteProduct,
  getUsers,
  subscribeStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  seedStatuses
} from '../services/crmService';
import { Lead, LeadStatus, Note, ActivityLog, Product, UserProfile, UserRole, StatusConfig } from '../types/crm';
import { getUserName, getUserAvatar } from '../lib/userUtils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Avatar, 
  AvatarImage, 
  AvatarFallback 
} from '../components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '../components/ui/popover';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { apiFetch, ApiRequestError } from '../services/apiClient';
import WhatsAppModal from '../components/WhatsAppModal';
import EmailModal from '../components/EmailModal';
import StatusSelector from '../components/StatusSelector';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../components/ui/tabs';
import { format, isToday, isPast, parseISO, addDays, isAfter } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../lib/utils';

const STATUS_COLORS_MAP: Record<string, string> = {
  'slate': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
  'blue': 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
  'amber': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  'emerald': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  'rose': 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
  'indigo': 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
  'purple': 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  'orange': 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  'green': 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  'red': 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
};

const TAG_COLORS: Record<string, string> = {
  'Hot': 'bg-rose-500 text-white',
  'Warm': 'bg-amber-500 text-white',
  'Cold': 'bg-indigo-500 text-white',
  'Important': 'bg-indigo-600 text-white'
};

const RoleBadge = ({ role }: { role: UserRole }) => {
  const configs = {
    admin: { label: 'Admin', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    manager: { label: 'Manager', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    sales: { label: 'Sales', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    user: { label: 'User', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' }
  };
  const config = configs[role as keyof typeof configs] || configs.user;
  return (
    <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-[0.2em] border px-2 py-0.5 rounded-md", config.color)}>
      {config.label}
    </Badge>
  );
};

const InlineEdit = ({ 
  value, 
  onSave, 
  type = 'text', 
  options = [], 
  label,
  className
}: { 
  value: string, 
  onSave: (val: string) => void, 
  type?: 'text' | 'select' | 'tel' | 'email',
  options?: { label: string, value: string }[],
  label: string,
  className?: string
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200" onClick={(e) => e.stopPropagation()}>
        {type === 'select' ? (
          <Select value={currentValue} onValueChange={(val) => { setCurrentValue(val); }}>
            <SelectTrigger className="h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
              {options.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="font-bold">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input 
            type={type}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            className="h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold shadow-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
          />
        )}
        <div className="flex items-center gap-1">
          <Button size="icon" onClick={handleSave} className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm">
            <Check className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="h-8 w-8 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group flex items-center justify-between gap-2 cursor-pointer p-1 -m-1 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">{value || `Add ${label}`}</span>
      <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

const Leads: React.FC = () => {
  const { user, profile, isAdmin, isManager } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>((window as any).usersList || []);
  
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [leadActivities, setLeadActivities] = useState<ActivityLog[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isFollowUpNote, setIsFollowUpNote] = useState(false);
  const [noteFollowUpDate, setNoteFollowUpDate] = useState<string>(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedUserFilter, setAssignedUserFilter] = useState<string>('all');
  const [requirementFilter, setRequirementFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{from: string, to: string}>({from: '', to: ''});
  
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof Lead>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState(10);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addTab, setAddTab] = useState<'manual' | 'single' | 'bulk'>('manual');
  const [singlePasteData, setSinglePasteData] = useState('');
  const [singlePastePreview, setSinglePastePreview] = useState<any | null>(null);
  const [singlePasteFormat, setSinglePasteFormat] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'activity' | 'files'>('overview');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('lead_visible_fields');
    return saved ? JSON.parse(saved) : {
      phone: true,
      email: true,
      location: true,
      requirement: true,
      source: true,
      company: true,
      assignment: true,
      status: true,
      priority: true
    };
  });

  const toggleFieldVisibility = (field: string) => {
    setVisibleFields(prev => {
      const next = { ...prev, [field]: !prev[field] };
      localStorage.setItem('lead_visible_fields', JSON.stringify(next));
      return next;
    });
  };
  
  const [isProductDeleteDialogOpen, setIsProductDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isNoteDeleteDialogOpen, setIsNoteDeleteDialogOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [productSearch, setProductSearch] = useState('');
  
  const ProductRequirementForm = ({ 
    products, 
    onChange 
  }: { 
    products: { name: string; quantity: number }[]; 
    onChange: (products: { name: string; quantity: number }[]) => void 
  }) => {
    const addRow = () => onChange([...products, { name: '', quantity: 1 }]);
    const removeRow = (index: number) => onChange((products || []).filter((_, i) => i !== index));
    const updateRow = (index: number, field: string, value: any) => {
      const newProducts = [...products];
      newProducts[index] = { ...newProducts[index], [field]: value };
      onChange(newProducts);
    };

    return (
      <div className="space-y-4">
        {(products || []).map((p, idx) => (
          <div key={idx} className="flex gap-4 items-end animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product {idx + 1}</label>
              <ProductSelector 
                value={p.name} 
                onChange={(val) => updateRow(idx, 'name', val)} 
              />
            </div>
            <div className="w-24 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty</label>
              <Input 
                type="number" 
                min="1" 
                value={p.quantity} 
                onChange={(e) => updateRow(idx, 'quantity', parseInt(e.target.value) || 0)}
                className="h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-black text-sm shadow-inner text-center"
              />
            </div>
            {products.length > 1 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeRow(idx)}
                className="h-14 w-14 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        ))}
        <Button 
          type="button"
          variant="outline" 
          onClick={addRow}
          className="w-full h-12 rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>
    );
  };

  const [newLead, setNewLead] = useState<Partial<Lead>>({
    status: 'New',
    source: 'IndiaMART',
    city: '',
    address: '',
    products: [{ name: '', quantity: 1 }],
    tags: []
  });

  const [importRawData, setImportRawData] = useState('');
  const [importPreview, setImportPreview] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !profile) return;
    const unsubscribe = subscribeLeads((data) => {
      setLeads(data);
      setIsLoading(false);
    }, profile.role, user.uid);
    return () => unsubscribe();
  }, [user, profile]);

  useEffect(() => {
    if (selectedLead) {
      const unsubscribeNotes = subscribeLeadNotes(selectedLead.id, setNotes);
      const unsubscribeActivities = subscribeActivityLog(setLeadActivities, profile?.role || 'sales', user?.uid || '', 50, selectedLead.id);
      
      return () => {
        unsubscribeNotes();
        unsubscribeActivities();
      };
    }
  }, [selectedLead, user, profile]);

  useEffect(() => {
    if (selectedLead && activeTab === 'activity' && profile) {
      const unsubscribe = subscribeActivityLog(setActivityLogs, profile.role, profile.uid, 50);
      return () => unsubscribe();
    }
  }, [selectedLead, activeTab]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeStatuses((data) => {
      // De-duplicate by label to avoid key errors if multiple docs exist
      const uniqueStatuses = data.reduce((acc, curr) => {
        if (!acc.find(s => s.label === curr.label)) {
          acc.push(curr);
        }
        return acc;
      }, [] as StatusConfig[]);
      setStatuses(uniqueStatuses);
    });
    const unsubscribeProducts = subscribeProducts(setProducts);
    seedStatuses();
    seedProducts();
    cleanupLeadsData();
    return () => {
      unsubscribe();
      unsubscribeProducts();
    };
  }, [user]);

  const getStatusClasses = (statusLabel: string) => {
    const status = (statuses || []).find(s => s.label === statusLabel);
    if (!status) return STATUS_COLORS_MAP['slate'];
    return STATUS_COLORS_MAP[status.color] || STATUS_COLORS_MAP['slate'];
  };

  const getSaaSStatusBadgeClass = (statusLabel: string) => {
    const normalized = (statusLabel || '').toLowerCase();
    if (normalized.includes('new')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (normalized.includes('contact')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (normalized.includes('qualif')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (normalized.includes('convert')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const ALLOWED_STATUSES = (statuses || []).map(s => s.label);
  const KANBAN_STATUSES = statuses || [];

  const LEAD_SOURCES = ['Website', 'WhatsApp', 'Call', 'Referral', 'Other'];
  const LEAD_TAGS = ['Hot', 'Warm', 'Cold', 'Important'];

  useEffect(() => {
    getUsers().then(data => {
      if (data) {
        setUsers(data);
      }
    });
  }, [profile]);

  useEffect(() => {
    if (leads.length === 0) return;
    
    const missingUids = new Set<string>();
    leads.forEach(l => {
      if (l.createdBy && !(users || []).find(u => u.uid === l.createdBy)) {
        missingUids.add(l.createdBy);
      }
    });

    if (missingUids.size > 0) {
      const fetchMissing = async () => {
        try {
          const snaps = await Promise.all(Array.from(missingUids).map(uid => getDoc(doc(db, 'users', uid))));
          const newUsers = snaps.filter(s => s.exists()).map(s => ({ uid: s.id, ...s.data() } as UserProfile));
          if (newUsers.length > 0) {
            setUsers(prev => {
              const existingUids = new Set((prev || []).map(u => u.uid));
              const filteredNew = (newUsers || []).filter(u => !existingUids.has(u.uid));
              if (filteredNew.length === 0) return prev;
              return [...prev, ...filteredNew];
            });
          }
        } catch (err) {
          console.error("Error fetching missing users:", err);
        }
      };
      fetchMissing();
    }
  }, [leads, users]);

  const [isManageStatusesOpen, setIsManageStatusesOpen] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('slate');

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.phone) {
      toast.error('Name and Phone are required');
      return;
    }

    // Validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(newLead.phone.replace(/\D/g, ""))) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    if (newLead.email && !newLead.email.includes('@')) {
      toast.error('Email must contain @ symbol');
      return;
    }

    try {
      const cleanPhone = newLead.phone.replace(/\D/g, "").slice(-10);
      
      const validProducts = newLead.products?.filter(p => p.name.trim() !== '') || [];
      if (validProducts.length === 0) {
        toast.error('At least one product requirement is required');
        return;
      }

      // Fix Company/Email swap if user entered email in company field
      let finalLead = { ...newLead, products: validProducts };
      if (finalLead.companyName && finalLead.companyName.includes('@')) {
        const temp = finalLead.companyName;
        finalLead.companyName = finalLead.email || 'Individual';
        finalLead.email = temp;
      }

      const leadId = await createLead({
        ...finalLead,
        phone: cleanPhone,
        status: finalLead.status || 'New'
      } as any);

      if (finalLead.initialNote && leadId) {
        await addNote(leadId, finalLead.initialNote, finalLead.followUpDate);
      }
      
      setIsAddDialogOpen(false);
      setNewLead({ 
        status: 'New',
        source: 'IndiaMART',
        city: '',
        address: '',
        products: [{ name: '', quantity: 1 }],
        tags: [],
        initialNote: '',
        followUpDate: ''
      });
      toast.success('Lead created successfully');
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  const handleUpdateField = async (field: string, value: any) => {
    if (!selectedLead || !user) return;
    try {
      const oldValue = (selectedLead as any)[field];
      await updateLead(selectedLead.id, { [field]: value });
      setSelectedLead({ ...selectedLead, [field]: value });
      
      const details = typeof value === 'string' || typeof value === 'number' 
        ? `changed ${field} from "${oldValue}" to "${value}"`
        : `updated ${field}`;
      
      await logActivity(user.uid, selectedLead.id, `Updated ${field}`, details);
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const handleUpdateProduct = async (idx: number, field: string, value: any) => {
    if (!selectedLead) return;
    const newProducts = [...(selectedLead.products || [])];
    newProducts[idx] = { ...newProducts[idx], [field]: value };
    await handleUpdateField('products', newProducts);
  };

  const handleRemoveProductItem = async (idx: number) => {
    if (!selectedLead) return;
    const newProducts = selectedLead.products?.filter((_, i) => i !== idx) || [];
    await handleUpdateField('products', newProducts);
  };

  const handleAddProductItem = async () => {
    if (!selectedLead) return;
    const newProducts = [...(selectedLead.products || []), { name: '', quantity: 1 }];
    await handleUpdateField('products', newProducts);
  };

  const handleUpdateStatus = async (leadId: string, status: string) => {
    try {
      if (!user) return;
      await updateLead(leadId, { status });
      await logActivity(user.uid, leadId, `Status changed to ${status}`);
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status });
      }
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };



  const handleSetFollowUp = async (leadId: string, days: number) => {
    try {
      const date = addDays(new Date(), days);
      const dateStr = date.toISOString();
      await updateLead(leadId, { followUpDate: dateStr });
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, followUpDate: dateStr });
      }
      toast.success(`Follow-up set for ${format(date, 'MMM d')}`);
    } catch (error) {
      toast.error('Failed to set follow-up');
    }
  };

  const handleAddNote = async () => {
    if (!selectedLead || !newNote.trim() || !user) return;

    setIsSavingNote(true);
    try {
      const followUpDate = isFollowUpNote ? noteFollowUpDate : undefined;
      await addNote(
        selectedLead.id, 
        newNote, 
        followUpDate
      );

      // Update selectedLead locally for immediate feedback
      if (followUpDate) {
        // Persist the status change to Firestore
        await updateLead(selectedLead.id, { 
          followUpDate,
          status: 'Follow-up Scheduled' 
        });

        setSelectedLead({
          ...selectedLead,
          followUpDate,
          status: 'Follow-up Scheduled'
        });
      }

      await logActivity(user.uid, selectedLead.id, `Note added: ${newNote.substring(0, 50)}...`);
      setNewNote('');
      setIsFollowUpNote(false);
      setNoteFollowUpDate(format(addDays(new Date(), 1), "yyyy-MM-dd"));
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const getLeadRequirementText = (lead: Lead) => {
    const explicitRequirement = (lead as any)?.requirement || (lead as any)?.product;
    if (explicitRequirement && String(explicitRequirement).trim()) return String(explicitRequirement).trim();
    if (lead.products && lead.products.length > 0 && lead.products[0]?.name) return lead.products[0].name;
    return 'your requirement';
  };

  const handleEmail = (lead: Lead) => {
    if (!lead?.email) {
      toast.error('No email address provided');
      return;
    }

    const safeName = (lead?.name || '').trim() || 'Customer';
    const safeRequirement = getLeadRequirementText(lead);
    const subject = 'Regarding Your Inquiry - A V Corporation';
    const body = `Dear ${safeName},

Thank you for reaching out to A V Corporation.
We have received your requirement for ${safeRequirement}.

Our team will connect with you shortly.

Best Regards,
A V Corporation`;

    const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleWhatsAppFollowUp = (lead: Lead) => {
    if (!lead?.phone) {
      toast.error('No phone number provided');
      return;
    }

    const safeName = (lead?.name || '').trim() || 'Customer';
    const safeRequirement = getLeadRequirementText(lead);
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const message = `Hi ${safeName},
Thank you for contacting A V Corporation.
We have received your requirement for ${safeRequirement}.
Our team will get back to you shortly.

Regards,
A V Corporation`;
    const encodedMessage = encodeURIComponent(message);

    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      toast.error('Product name is required');
      return;
    }

    try {
      const cleaned = cleanProductName(newProductName.trim());
      const productId = await createProduct(cleaned);
      if (productId) {
        // Auto-select the new product
        if (isEditDialogOpen && editingLead) {
          setEditingLead({ ...editingLead, product: cleaned });
        } else {
          setNewLead({ ...newLead, product: cleaned });
        }
        setIsAddProductOpen(false);
        setNewProductName('');
        toast.success('Product added and selected');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product');
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatusLabel.trim()) return;
    try {
      await createStatus({
        label: newStatusLabel.trim(),
        color: newStatusColor,
        order: statuses.length + 1
      });
      setNewStatusLabel('');
      toast.success('Status created');
    } catch (error) {
      toast.error('Failed to create status');
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!window.confirm('Are you sure? This will fail if status is in use.')) return;
    try {
      await deleteStatus(id);
      toast.success('Status deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete status');
    }
  };

  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const ProductSelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [open, setOpen] = useState(false);
    const [recentProducts, setRecentProducts] = useState<string[]>([]);
    const cleanedValue = cleanProductName(value);

    useEffect(() => {
      const saved = localStorage.getItem('recent_products');
      if (saved) setRecentProducts(JSON.parse(saved));
    }, []);

    const updateRecent = (name: string) => {
      const updated = [name, ...(recentProducts || []).filter(p => p !== name)].slice(0, 5);
      setRecentProducts(updated);
      localStorage.setItem('recent_products', JSON.stringify(updated));
    };

    const uniqueProducts: { id: string, name: string }[] = Array.from(new Set((products || []).map(p => cleanProductName(p.name))))
      .filter((name: string) => {
        const codePattern = /AV\s*\(M\)\s*\d+/i;
        return !codePattern.test(name) && name.length > 2;
      })
      .map((name: string) => ({ id: name, name }));
    
    const sortedProducts = [...uniqueProducts].sort((a, b) => a.name.localeCompare(b.name));
    
    const filteredProducts = (sortedProducts || []).filter(p => 
      p?.name?.toLowerCase().includes((productSearch || '').toLowerCase())
    );

    const recentItems = (recentProducts || [])
      .map(name => uniqueProducts.find(p => p.name === name))
      .filter((p): p is { id: string, name: string } => !!p && !!p.name && p.name.toLowerCase().includes((productSearch || '').toLowerCase()));

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner transition-all",
                cleanedValue ? "text-slate-900 dark:text-white" : "text-slate-500"
              )}
            >
              {cleanedValue || "Select product..."}
              <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          )}
        />
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <ScrollArea className="h-[250px]">
            <div className="p-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-blue-600 font-medium mb-1 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  setIsAddProductOpen(true);
                  setOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Product
              </Button>

              {recentItems.length > 0 && !productSearch && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Recently Used</div>
                  {recentItems.map((product) => (
                    <Button
                      key={`recent-${product.id}`}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start font-normal h-8 text-sm",
                        cleanedValue === product.name && "bg-blue-50 text-blue-700 font-medium"
                      )}
                      onClick={() => {
                        onChange(product.name);
                        updateRecent(product.name);
                        setOpen(false);
                      }}
                    >
                      {product.name}
                    </Button>
                  ))}
                  <div className="h-px bg-slate-100 my-1 mx-1" />
                </div>
              )}

              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">All Products</div>
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center">No products found.</div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="flex items-center group px-1">
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex-1 justify-start font-normal h-8 text-sm truncate",
                        cleanedValue === product.name && "bg-blue-50 text-blue-700 font-medium"
                      )}
                      onClick={() => {
                        onChange(product.name);
                        updateRecent(product.name);
                        setOpen(false);
                      }}
                    >
                      {product.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductToDelete(product);
                        setIsProductDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  };

  const handleUpdateLead = async () => {
    if (!editingLead) return;

    if (editingLead.email && !editingLead.email.includes('@')) {
      toast.error('Email must contain @ symbol');
      return;
    }

    if (editingLead.companyName && editingLead.companyName.includes('@')) {
      toast.error('Company Name should not be an email address');
      return;
    }

    try {
      const { id, ...data } = editingLead;
      await updateLead(id, data);
      await logActivity(user.uid, id, 'Lead details updated');
      setIsEditDialogOpen(false);
      setSelectedLead(editingLead);
      toast.success('Lead updated successfully');
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const handlePreviewSinglePaste = async () => {
    if (!singlePasteData.trim()) return;
    
    try {
      const response = await apiFetch('/api/leads/add-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawData: singlePasteData })
      });
      
      const { lead, format, message } = await response.json();
      setSinglePastePreview(lead);
      setSinglePasteFormat(format);
      if (format === 'SPACE') {
        toast.info(message);
      }
    } catch (error: any) {
      if (error instanceof ApiRequestError && error.status === 401) {
        toast.error('Session verification failed for this request. Please retry.');
      } else {
        toast.error(error.message || 'Invalid format');
      }
      setSinglePastePreview(null);
    }
  };

  const handleSinglePasteImport = async () => {
    if (!singlePastePreview) return;
    
    try {
      // Duplicate Detection
      const exists = await checkLeadExistsByPhone(singlePastePreview.phone);
      if (exists) {
        toast.error('Duplicate lead skipped (Phone already exists)');
        return;
      }

      const { note, ...leadData } = singlePastePreview;
      const createdLeadId = await createLead({
        ...leadData
      });
      
      if (note && createdLeadId) {
        await addNote(createdLeadId, note);
      }
      
      if (createdLeadId && user) {
        await logActivity(user.uid, createdLeadId, 'Lead created via single paste');
      }

      toast.success('Lead added successfully');
      setIsAddDialogOpen(false);
      setSinglePasteData('');
      setSinglePastePreview(null);
      setSinglePasteFormat(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save lead');
    }
  };

  const handleParseImportData = async () => {
    if (!importRawData.trim()) return;
    
    try {
      const response = await apiFetch('/api/leads/import-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawData: importRawData })
      });

      const data = await response.json();
      setImportPreview(data.leads);
    } catch (error: any) {
      if (error instanceof ApiRequestError && error.status === 401) {
        toast.error('Session verification failed for this request. Please retry.');
      } else {
        toast.error(error.message || 'Failed to parse data from server');
      }
    }
  };

  const handleBulkImport = async () => {
    if (importPreview.length === 0) return;
    
    setIsImporting(true);
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
      for (const leadData of importPreview) {
        if (!leadData.isValid) {
          errorCount++;
          continue;
        }

        // Duplicate Detection
        const exists = await checkLeadExistsByPhone(leadData.phone);
        if (exists) {
          skipCount++;
          continue;
        }

        const { isValid, error, note, ...cleanData } = leadData;
        const createdLeadId = await createLead({
          ...cleanData
        });
        
        if (note && createdLeadId) {
          await addNote(createdLeadId, note);
        }
        
        if (createdLeadId && user) {
          await logActivity(user.uid, createdLeadId, 'Lead created via bulk import');
        }
        successCount++;
      }

      toast.success(`Import complete: ${successCount} added, ${skipCount} skipped (duplicates)`);
      setIsAddDialogOpen(false);
      setImportRawData('');
      setImportPreview([]);
    } catch (error) {
      toast.error('Error during bulk import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteLeadsBulk(selectedLeadIds);
      toast.success(`${selectedLeadIds.length} leads moved to recycle bin`);
      setSelectedLeadIds([]);
      setIsBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete leads');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    setIsProcessing(true);
    try {
      await deleteLead(leadToDelete);
      toast.success('Lead moved to recycle bin');
      setIsDeleteDialogOpen(false);
      setLeadToDelete(null);
      if (selectedLead?.id === leadToDelete) {
        setIsDetailsOpen(false);
        setSelectedLead(null);
      }
    } catch (error) {
      toast.error('Failed to delete lead');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'City', 'Company', 'Status', 'Source', 'Requirement', 'Created At'];
    const rows = sortedLeads.map(l => [
      l.name,
      l.phone,
      l.email || '',
      l.city || '',
      l.companyName || '',
      l.status,
      l.source || '',
      l.product || '',
      l.createdAt
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCleanup = async () => {
    try {
      const count = await cleanupLeadsData();
      if (count > 0) {
        toast.success(`Cleaned up ${count} leads`);
      } else {
        toast.info('No leads needed cleanup');
      }
    } catch (error) {
      toast.error('Failed to cleanup leads');
    }
  };

  const handleToggleSelectAll = () => {
    const fLeads = (filteredLeads || []);
    if (selectedLeadIds.length === fLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(fLeads.map(l => l.id));
    }
  };

  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => 
      (prev || []).includes(id) ? (prev || []).filter(i => i !== id) : [...(prev || []), id]
    );
  };

  const filteredLeads = (leads || []).filter(lead => {
    const name = lead.name || '';
    const phone = lead.phone || '';
    const email = lead.email || '';
    const city = lead.city || '';
    const search = searchTerm || '';
    
    const matchesSearch = 
      name.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search) ||
      email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesCity = cityFilter === 'all' || lead.city === cityFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    const matchesTag = tagFilter === 'all' || (lead.tags && lead.tags.includes(tagFilter));
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    const matchesAssigned = assignedUserFilter === 'all' || lead.assignedTo === assignedUserFilter;
    
    // Requirement filter: check if any product name matches
    const matchesRequirement = requirementFilter === 'all' || (lead.products && lead.products.some(p => p.name === requirementFilter));
    
    let matchesDate = true;
    if (dateRange.from && dateRange.to) {
      try {
        const createdAt = lead.createdAt ? parseISO(lead.createdAt) : new Date(0);
        const fromDate = parseISO(dateRange.from);
        const toDate = parseISO(dateRange.to);
        
        if (!isNaN(createdAt.getTime()) && !isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
          matchesDate = createdAt >= fromDate && createdAt <= toDate;
        }
      } catch (e) {
        matchesDate = true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCity && matchesSource && matchesTag && matchesPriority && matchesDate && matchesAssigned && matchesRequirement;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * leadsPerPage,
    currentPage * leadsPerPage
  );

  const totalPages = Math.ceil(sortedLeads.length / leadsPerPage);

  const cities = Array.from(new Set((leads || []).map(l => l.city).filter(Boolean))) as string[];

  const getFollowUpStatus = (date?: string) => {
    if (!date) return null;
    try {
      const d = parseISO(date);
      if (isPast(d) && !isToday(d)) return 'overdue';
      if (isToday(d)) return 'today';
      return 'upcoming';
    } catch (e) {
      return null;
    }
  };

  const stats = {
    total: (leads || []).length,
    newLeads: (leads || []).filter((l) => (l.status || '').toLowerCase().includes('new')).length,
    contacted: (leads || []).filter((l) => (l.status || '').toLowerCase().includes('contact')).length,
    converted: (leads || []).filter((l) => {
      const s = (l.status || '').toLowerCase();
      return s.includes('converted') || s.includes('won') || s.includes('deal done');
    }).length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
        <div className="relative flex-1 min-w-[280px] max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search leads, contacts, accounts..."
            className="h-11 pl-11 rounded-xl border-slate-200 bg-slate-50 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="relative h-10 w-10 rounded-xl border-slate-200">
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">3</span>
          </Button>
          <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-3 py-1.5">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                {(profile?.name || 'U').slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <p className="text-xs font-bold text-slate-800">{profile?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 uppercase">{profile?.role || 'user'}</p>
            </div>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" /> Quick Add
          </Button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 group transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Leads</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 leading-tight">{stats.total}</span>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
                <ChevronUp className="w-3 h-3" /> 12%
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">this month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 group transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">New Leads</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 leading-tight">{stats.newLeads}</span>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
                <ChevronUp className="w-3 h-3" /> 9%
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">this month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 group transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Contacted</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 leading-tight">{stats.contacted}</span>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
                <ChevronUp className="w-3 h-3" /> 11%
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">this month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 group transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Converted</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 leading-tight">{stats.converted}</span>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
                <ChevronUp className="w-3 h-3" /> 6%
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">this month</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/50 mb-6">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">Manage and track all your business opportunities.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-medium text-sm gap-2">
            <Settings className="w-4 h-4" /> Customize view
          </Button>

          <Button
            variant="outline"
            className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-medium text-sm gap-2"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger
              render={(props) => (
                <Button {...props} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm h-11 px-5 shadow-sm transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Add new lead
                </Button>
              )}
            />

            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-[32px] border-none shadow-2xl bg-white dark:bg-slate-900">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Add New Lead</DialogTitle>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Capture new business opportunities</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsAddDialogOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <Tabs value={addTab} onValueChange={(v: any) => setAddTab(v)} className="w-full">
                  <TabsList className="grid grid-cols-3 h-14 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl mb-8">
                    <TabsTrigger value="manual" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600">
                      <UserIcon className="w-3.5 h-3.5 mr-2" />
                      Manual Entry
                    </TabsTrigger>
                    <TabsTrigger value="single" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600">
                      <Clipboard className="w-3.5 h-3.5 mr-2" />
                      Single Paste
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600">
                      <Database className="w-3.5 h-3.5 mr-2" />
                      Bulk Import
                    </TabsTrigger>
                  </TabsList>

              <TabsContent value="manual" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <UserIcon className="w-3.5 h-3.5" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name*</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="John Doe" 
                          className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                          value={newLead.name || ''}
                          onChange={e => setNewLead({...newLead, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number*</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="+91 98765 43210" 
                          className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                          value={newLead.phone || ''}
                          onChange={e => setNewLead({...newLead, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          type="email"
                          placeholder="john@example.com" 
                          className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                          value={newLead.email || ''}
                          onChange={e => setNewLead({...newLead, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="Pune" 
                          className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                          value={newLead.city || ''}
                          onChange={e => setNewLead({...newLead, city: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Database className="w-3.5 h-3.5" />
                    Business & Product Context
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="Acme Corp" 
                          className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                          value={newLead.companyName || ''}
                          onChange={e => setNewLead({...newLead, companyName: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Requirements*</label>
                    <ProductRequirementForm 
                      products={newLead.products || []}
                      onChange={(products) => setNewLead({ ...newLead, products })}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Activity className="w-3.5 h-3.5" />
                    Status & Assignment
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Status</label>
                      <StatusSelector 
                        selectedStatus={newLead.status || ''}
                        statuses={statuses}
                        onStatusChange={(val) => setNewLead({...newLead, status: val})}
                        onRefresh={() => seedStatuses()}
                        onAddStatus={() => setIsManageStatusesOpen(true)}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Operative</label>
                      <Select 
                        value={newLead.assignedTo || ''} 
                        onValueChange={(v) => setNewLead({...newLead, assignedTo: v})}
                      >
                        <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner px-5">
                          <SelectValue placeholder="Select Operative" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {(users || []).filter(u => u.role === 'sales' || u.role === 'manager' || u.role === 'admin').map(u => (
                            <SelectItem key={u.uid} value={u.uid} className="font-bold">{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Users className="w-3.5 h-3.5" />
                    Source & Tags
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Source</label>
                      <Select 
                        value={newLead.source || 'Website'} 
                        onValueChange={(v) => setNewLead({...newLead, source: v})}
                      >
                        <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-sm px-5">
                          <SelectValue placeholder="Select Source" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                          {LEAD_SOURCES.map(s => (
                            <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags</label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {LEAD_TAGS.map(tag => (
                          <Badge 
                            key={tag} 
                            variant={newLead.tags?.includes(tag) ? 'default' : 'outline'}
                            className={cn(
                              "cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                              newLead.tags?.includes(tag) ? TAG_COLORS[tag] + " border-transparent shadow-sm" : "text-slate-400 border-slate-200 dark:border-slate-800"
                            )}
    onClick={() => {
      const currentTags = (newLead.tags || []);
      const isActive = currentTags.includes(tag);
      const nextTags = isActive 
        ? currentTags.filter(t => t !== tag) 
        : [...currentTags, tag];
      setNewLead({...newLead, tags: nextTags});
    }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Location Details
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City / Region</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="Pune" 
                          className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                          value={newLead.city || ''}
                          onChange={e => setNewLead({...newLead, city: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
                      <div className="relative">
                        <Map className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                        <textarea 
                          className="w-full min-h-[56px] pl-12 pt-4 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white outline-none shadow-inner"
                          placeholder="Building, Street, Area..."
                          value={newLead.address || ''}
                          onChange={e => setNewLead({...newLead, address: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Priority & Context
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Priority</label>
                      <Select 
                        value={newLead.priority || 'Warm'} 
                        onValueChange={(v: any) => setNewLead({...newLead, priority: v})}
                      >
                        <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-sm px-5">
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                          <SelectItem value="Hot" className="font-bold text-rose-600">🔥 Hot</SelectItem>
                          <SelectItem value="Warm" className="font-bold text-amber-600">☀️ Warm</SelectItem>
                          <SelectItem value="Cold" className="font-bold text-indigo-600">❄️ Cold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Initial Notes & Follow-up
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                      <textarea 
                        className="w-full min-h-[100px] p-5 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white outline-none shadow-inner"
                        placeholder="Add some details about the first interaction..."
                        value={newLead.initialNote || ''}
                        onChange={e => setNewLead({...newLead, initialNote: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Follow-up Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <Input 
                            type="date" 
                            className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-xs shadow-inner px-5"
                            value={newLead.followUpDate || ''}
                            onChange={e => setNewLead({...newLead, followUpDate: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button onClick={handleCreateLead} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]">
                    Create New Lead
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="single" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paste Single IndiaMART Lead</label>
                    <textarea 
                      className="w-full min-h-[120px] p-5 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white outline-none shadow-inner"
                      placeholder="Paste single line here (TAB or SPACE separated)..."
                      value={singlePasteData}
                      onChange={e => {
                        setSinglePasteData(e.target.value);
                        setSinglePastePreview(null);
                      }}
                    />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Smart detection: Handles both TAB and multi-space formats.</p>
                  </div>
                  
                  {!singlePastePreview ? (
                    <Button onClick={handlePreviewSinglePaste} className="w-full h-14 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98]">
                      Preview Parsed Lead
                    </Button>
                  ) : (
                    <div className="space-y-6 animate-in zoom-in-95">
                      <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Parsed Preview</h4>
                          {singlePasteFormat === 'SPACE' && (
                            <Badge className="bg-indigo-200 text-indigo-800 border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">Detected SPACE format</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                          <div className="text-slate-500 font-bold">Name:</div>
                          <div className="font-black text-slate-900 dark:text-white">{singlePastePreview.name}</div>
                          <div className="text-slate-500 font-bold">Phone:</div>
                          <div className="font-black text-slate-900 dark:text-white">{singlePastePreview.phone}</div>
                          <div className="text-slate-500 font-bold">Company:</div>
                          <div className="font-black text-slate-900 dark:text-white">{singlePastePreview.companyName}</div>
                          <div className="text-slate-500 font-bold">City:</div>
                          <div className="font-black text-slate-900 dark:text-white">{singlePastePreview.city}</div>
                          <div className="text-slate-500 font-bold">Product:</div>
                          <div className="font-black text-slate-900 dark:text-white truncate">{singlePastePreview.product}</div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest" onClick={() => setSinglePastePreview(null)}>Reset</Button>
                        <Button onClick={handleSinglePasteImport} className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]">Add Lead</Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="bulk" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paste Multiple Leads (IndiaMART Format)</label>
                    <textarea 
                      className="w-full min-h-[150px] p-5 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white outline-none shadow-inner"
                      placeholder="Paste multiple rows here..."
                      value={importRawData}
                      onChange={e => setImportRawData(e.target.value)}
                    />
                    <Button 
                      variant="secondary" 
                      className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-800 hover:bg-slate-900 text-white shadow-xl transition-all active:scale-[0.98]" 
                      onClick={handleParseImportData}
                      disabled={!importRawData.trim()}
                    >
                      Preview Parsed Data
                    </Button>
                  </div>

                  {importPreview.length > 0 && (
                    <div className="space-y-4 animate-in zoom-in-95">
                      <div className="flex items-center justify-between ml-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preview ({importPreview.length} leads)</h3>
                        <Badge className="bg-indigo-100 text-indigo-700 border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">
                          {(importPreview || []).filter(p => !!p && p.isValid).length} Valid
                        </Badge>
                      </div>
                      <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden max-h-[250px] overflow-y-auto shadow-sm">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                            <tr>
                              <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Name</th>
                              <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Phone</th>
                              <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">City</th>
                              <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {(importPreview || []).map((p, i) => (
                              <tr key={i} className={cn(!p.isValid && "bg-rose-50/50 dark:bg-rose-900/10")}>
                                <td className="p-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                                <td className="p-4 font-medium text-slate-500">{p.phone}</td>
                                <td className="p-4 font-medium text-slate-500 truncate max-w-[120px]">{p.city}</td>
                                <td className="p-4">
                                  {p.isValid ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Valid
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-widest">
                                      <AlertCircle className="w-3 h-3" />
                                      Invalid
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Button 
                        onClick={handleBulkImport} 
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]"
                        disabled={isImporting || (importPreview || []).filter(p => !!p && p.isValid).length === 0}
                      >
                        {isImporting ? 'Importing...' : `Import ${(importPreview || []).filter(p => !!p && p.isValid).length} Valid Leads`}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-[28px] shadow-sm border border-slate-100 dark:border-white/5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[300px]">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
               placeholder="Search by name, phone, email..." 
               className="h-12 pl-12 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Pill */}
            <Popover>
              <PopoverTrigger render={
                <Button variant="outline" className={cn(
                  "h-10 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 px-4 transition-all",
                  statusFilter !== 'all' && "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                )}>
                  <Activity className="w-3.5 h-3.5" />
                  Status: {statusFilter === 'all' ? 'All' : statusFilter}
                  {statusFilter !== 'all' && <X className="w-3 h-3 ml-1 hover:text-rose-500" onClick={(e) => { e.stopPropagation(); setStatusFilter('all'); }} />}
                </Button>
              } />
              <PopoverContent className="w-56 p-2 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900">
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start font-bold text-xs rounded-lg" onClick={() => setStatusFilter('all')}>All Statuses</Button>
                  {ALLOWED_STATUSES.map(s => (
                    <Button key={s} variant="ghost" className="w-full justify-start font-bold text-xs rounded-lg" onClick={() => setStatusFilter(s)}>{s}</Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Source Filter Pill */}
            <Popover>
              <PopoverTrigger render={
                <Button variant="outline" className={cn(
                  "h-10 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 px-4 transition-all",
                  sourceFilter !== 'all' && "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                )}>
                  <Globe className="w-3.5 h-3.5" />
                  Source: {sourceFilter === 'all' ? 'All' : sourceFilter}
                  {sourceFilter !== 'all' && <X className="w-3 h-3 ml-1 hover:text-rose-500" onClick={(e) => { e.stopPropagation(); setSourceFilter('all'); }} />}
                </Button>
              } />
              <PopoverContent className="w-56 p-2 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900">
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start font-bold text-xs rounded-lg" onClick={() => setSourceFilter('all')}>All Sources</Button>
                  {LEAD_SOURCES.map(s => (
                    <Button key={s} variant="ghost" className="w-full justify-start font-bold text-xs rounded-lg" onClick={() => setSourceFilter(s)}>{s}</Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* User Filter Pill */}
            <Popover>
              <PopoverTrigger render={
                <Button variant="outline" className={cn(
                  "h-10 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 px-4 transition-all",
                  assignedUserFilter !== 'all' && "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                )}>
                  <Users className="w-3.5 h-3.5" />
                  User: {assignedUserFilter === 'all' ? 'All' : (getUserName(assignedUserFilter, users) || assignedUserFilter)}
                  {assignedUserFilter !== 'all' && <X className="w-3 h-3 ml-1 hover:text-rose-500" onClick={(e) => { e.stopPropagation(); setAssignedUserFilter('all'); }} />}
                </Button>
              } />
              <PopoverContent className="w-64 p-2 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900">
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start font-bold text-xs rounded-lg" onClick={() => setAssignedUserFilter('all')}>All Users</Button>
                  {users.map(u => (
                    <Button key={u.uid} variant="ghost" className="w-full justify-start font-bold text-xs rounded-lg" onClick={() => setAssignedUserFilter(u.uid)}>{u.name}</Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

             {/* Location Filter Pill */}
             <Popover>
              <PopoverTrigger render={
                <Button variant="outline" className={cn(
                  "h-10 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 px-4 transition-all",
                  cityFilter !== 'all' && "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                )}>
                  <MapPin className="w-3.5 h-3.5" />
                  Location: {cityFilter === 'all' ? 'Everywhere' : cityFilter}
                  {cityFilter !== 'all' && <X className="w-3 h-3 ml-1 hover:text-rose-500" onClick={(e) => { e.stopPropagation(); setCityFilter('all'); }} />}
                </Button>
              } />
              <PopoverContent className="w-56 p-2 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900">
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start font-bold text-xs rounded-lg" onClick={() => setCityFilter('all')}>Everywhere</Button>
                  {cities.map(c => (
                    <Button key={c} variant="ghost" className="w-full justify-start font-bold text-xs rounded-lg" onClick={() => setCityFilter(c)}>{c}</Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Requirement Filter Pill */}
            <Popover>
              <PopoverTrigger render={
                <Button variant="outline" className={cn(
                  "h-10 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 px-4 transition-all",
                  requirementFilter !== 'all' && "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                )}>
                  <Tag className="w-3.5 h-3.5" />
                  Requirement: {requirementFilter === 'all' ? 'All' : requirementFilter}
                  {requirementFilter !== 'all' && <X className="w-3 h-3 ml-1 hover:text-rose-500" onClick={(e) => { e.stopPropagation(); setRequirementFilter('all'); }} />}
                </Button>
              } />
              <PopoverContent className="w-64 p-0 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900">
                 <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <Input placeholder="Search requirements..." className="h-8 text-xs rounded-lg" onChange={(e) => setProductSearch(e.target.value)} />
                 </div>
                 <ScrollArea className="h-60">
                    <div className="p-2 space-y-1">
                      <Button variant="ghost" className="w-full justify-start font-bold text-xs rounded-lg" onClick={() => setRequirementFilter('all')}>All Products</Button>
                      {Array.from(new Set((products || []).map(p => p.name))).map(pName => (
                        <Button key={pName} variant="ghost" className="w-full justify-start font-bold text-xs rounded-lg" onClick={() => setRequirementFilter(pName)}>{pName}</Button>
                      ))}
                    </div>
                 </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Date Range Filter Pill */}
            <Popover>
              <PopoverTrigger render={
                <Button variant="outline" className={cn(
                  "h-10 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 px-4 transition-all",
                  dateRange.from && "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                )}>
                  <Calendar className="w-3.5 h-3.5" />
                  {dateRange.from ? `${format(parseISO(dateRange.from), 'MMM d')} - ${format(parseISO(dateRange.to), 'MMM d')}` : 'Created Date'}
                  {dateRange.from && <X className="w-3 h-3 ml-1 hover:text-rose-500" onClick={(e) => { e.stopPropagation(); setDateRange({from: '', to: ''}); }} />}
                </Button>
              } />
              <PopoverContent className="w-80 p-4 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">From</label>
                    <Input type="date" className="h-10 rounded-xl text-xs" value={dateRange.from} onChange={(e) => setDateRange({...dateRange, from: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">To</label>
                    <Input type="date" className="h-10 rounded-xl text-xs" value={dateRange.to} onChange={(e) => setDateRange({...dateRange, to: e.target.value})} />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {(searchTerm || statusFilter !== 'all' || cityFilter !== 'all' || sourceFilter !== 'all' || tagFilter !== 'all' || dateRange.from || assignedUserFilter !== 'all' || requirementFilter !== 'all') && (
              <Button 
                variant="ghost"
                className="h-10 px-4 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCityFilter('all');
                  setSourceFilter('all');
                  setTagFilter('all');
                  setPriorityFilter('all');
                  setAssignedUserFilter('all');
                  setRequirementFilter('all');
                  setDateRange({from: '', to: ''});
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 w-12">
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer",
                        selectedLeadIds.length === (filteredLeads || []).length && (filteredLeads || []).length > 0 ? "bg-indigo-600 border-indigo-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      )} onClick={handleToggleSelectAll}>
                        {selectedLeadIds.length === (filteredLeads || []).length && (filteredLeads || []).length > 0 && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] min-w-[220px]">Lead Name</th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] min-w-[160px]">Company</th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] min-w-[180px]">Email</th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] min-w-[140px]">Phone</th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] min-w-[120px]">Source</th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] min-w-[140px]">Status</th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] min-w-[140px]">Assigned To</th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] min-w-[130px]">Created On</th>
                    <th className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {isLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={9} className="p-8">
                          <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
                        </td>
                      </tr>
                    ))
                  ) : (paginatedLeads || []).length > 0 ? (
                    (paginatedLeads || []).map((lead) => {
                      if (!lead) return null;
                      const isCompany = !!lead.companyName && lead.companyName.trim().length > 0;
                      const primaryName = isCompany ? lead.companyName : (lead.name || 'No Name');
                      
                      return (
                      <tr 
                        key={lead.id} 
                        className="group hover:bg-slate-50 transition-all cursor-pointer border-b border-slate-100 last:border-0"
                        onClick={() => {
                          setSelectedLead(lead);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shadow-sm",
                            selectedLeadIds.includes(lead.id) ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200"
                          )} onClick={() => handleToggleSelectLead(lead.id)}>
                            {selectedLeadIds.includes(lead.id) && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border-2 border-white shadow-sm shrink-0">
                              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-[13px]">
                                {(String(primaryName || '??')).split(' ').filter(Boolean).map(n => n[0] || '').join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="font-extrabold text-slate-900 text-sm tracking-tight truncate max-w-[200px]">{lead.name || 'No Name'}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className={cn(
                                  "text-[9px] px-1.5 py-0 h-4 font-black uppercase tracking-widest w-fit border-none",
                                  isCompany 
                                    ? "bg-indigo-600 text-white shadow-indigo-600/10"
                                    : "bg-slate-100 text-slate-500 shadow-none"
                                )}>
                                  {isCompany ? 'COMPANY' : 'INDIVIDUAL'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-700">{lead.companyName || 'Individual'}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-700">{lead.email || 'N/A'}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-700">{lead.phone || 'N/A'}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                           <div className="inline-flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md w-fit">
                              <Globe className="w-3.5 h-3.5 text-indigo-500" /> {lead.source || 'Website'}
                           </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <Badge className={cn("rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide", getSaaSStatusBadgeClass(lead.status || 'New'))}>
                            {lead.status || 'New'}
                          </Badge>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8 border border-slate-100 shadow-sm">
                              <AvatarFallback className="bg-slate-100 text-slate-500 font-bold text-[10px]">
                                {getUserAvatar(lead.assignedTo, users)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-900 tracking-tight leading-none">{(String(getUserName(lead.assignedTo, users) || 'Unassigned')).split(' ')[0]}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">EXECUTIVE</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-600">
                            {lead.createdAt ? format(parseISO(lead.createdAt), 'dd MMM yyyy') : 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-slate-100">
                                <MoreHorizontal className="w-4 h-4 text-slate-500" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end" className="rounded-xl w-44">
                              <DropdownMenuItem onClick={() => { setSelectedLead(lead); setIsDetailsOpen(true); }}>View details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`tel:${lead.phone || ''}`)}>Call lead</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleWhatsAppFollowUp(lead)}>WhatsApp follow-up</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-rose-600"
                                onClick={() => {
                                  setLeadToDelete(lead.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                Delete lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <Search className="w-8 h-8 text-slate-300" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">No leads found</h3>
                            <p className="text-sm text-slate-500">Try adjusting your filters or search term</p>
                          </div>
                          <Button 
                            variant="outline" 
                            className="rounded-xl font-bold text-xs"
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('all');
                              setCityFilter('all');
                              setSourceFilter('all');
                            }}
                          >
                            Clear All Filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {paginatedLeads.length === 0 && (
              <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 text-center text-slate-500">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    <Search className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">No matching leads</h3>
                  <p className="text-sm">Try adjusting your search or filters to find what you're looking for.</p>
                  <Button variant="outline" className="mt-4 rounded-xl px-8" onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCityFilter('all');
                    setSourceFilter('all');
                    setTagFilter('all');
                    setPriorityFilter('all');
                    setDateRange({from: '', to: ''});
                  }}>Clear all filters</Button>
                </div>
              </div>
            )}

          {/* Pagination Card */}
          <div className="bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm mt-6">
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Showing <span className="text-slate-900 dark:text-white font-extrabold tracking-tight">{(currentPage - 1) * leadsPerPage + 1} - {Math.min(currentPage * leadsPerPage, sortedLeads.length)}</span> of {sortedLeads.length} leads
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="w-8 h-8 rounded-lg border-slate-200 dark:border-slate-800 disabled:opacity-30"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'ghost'}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-bold",
                        currentPage === pageNum ? "bg-indigo-600 text-white" : "text-slate-500"
                      )}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && <span className="text-slate-400 px-1">...</span>}
                {totalPages > 5 && (
                  <Button
                    variant={currentPage === totalPages ? 'default' : 'ghost'}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold",
                      currentPage === totalPages ? "bg-indigo-600 text-white" : "text-slate-500"
                    )}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                )}
              </div>

              <Button 
                variant="outline" 
                size="icon" 
                className="w-8 h-8 rounded-lg border-slate-200 dark:border-slate-800 disabled:opacity-30"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Select value={leadsPerPage.toString()} onValueChange={(v) => { setLeadsPerPage(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 w-[100px] text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ) : (
        <KanbanBoard 
          leads={sortedLeads} 
          statuses={KANBAN_STATUSES} 
          users={users}
          onLeadClick={(lead) => {
            setSelectedLead(lead);
            setIsDetailsOpen(true);
          }}
          onStatusChange={handleUpdateStatus}
          onRefreshStatuses={() => seedStatuses()}
          onManageStatuses={() => setIsManageStatusesOpen(true)}
        />
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-[32px] border-none shadow-2xl bg-white dark:bg-slate-900">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                <Edit2 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Edit Lead</DialogTitle>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Update lead information and requirements</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsEditDialogOpen(false)}>
              <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>

          {editingLead && (
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <UserIcon className="w-3.5 h-3.5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name*</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="John Doe" 
                        className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                        value={editingLead.name}
                        onChange={e => setEditingLead({...editingLead, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number*</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="+91 98765 43210" 
                        className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                        value={editingLead.phone}
                        onChange={e => setEditingLead({...editingLead, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="email"
                        placeholder="john@example.com" 
                        className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                        value={editingLead.email || ''}
                        onChange={e => setEditingLead({...editingLead, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Acme Inc" 
                        className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                        value={editingLead.companyName || ''}
                        onChange={e => setEditingLead({...editingLead, companyName: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Requirements*</label>
                  <ProductRequirementForm 
                    products={editingLead.products || []}
                    onChange={(products) => setEditingLead({ ...editingLead, products })}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Location Details
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City / Region</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Pune" 
                        className="pl-12 h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                        value={editingLead.city || ''}
                        onChange={e => setEditingLead({...editingLead, city: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
                    <div className="relative">
                      <Map className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <textarea 
                        className="w-full min-h-[56px] pl-12 pt-4 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white outline-none shadow-inner"
                        placeholder="Building, Street, Area..."
                        value={editingLead.address || ''}
                        onChange={e => setEditingLead({...editingLead, address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

               <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Activity className="w-3.5 h-3.5" />
                  Status & Assignment
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Status</label>
                    <StatusSelector 
                      selectedStatus={editingLead.status || ''}
                      statuses={statuses}
                      onStatusChange={(val) => setEditingLead({...editingLead, status: val})}
                      onRefresh={() => seedStatuses()}
                      onAddStatus={() => setIsManageStatusesOpen(true)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Source</label>
                    <Select 
                      value={editingLead.source || 'Website'} 
                      onValueChange={(v) => setEditingLead({...editingLead, source: v})}
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-sm px-5">
                        <SelectValue placeholder="Select Source" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                        {LEAD_SOURCES.map(s => (
                          <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

               <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Priority & Schedule
                </h3>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Priority</label>
                    <Select 
                      value={editingLead.priority || 'Warm'} 
                      onValueChange={(v: any) => setEditingLead({...editingLead, priority: v})}
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-sm px-5">
                        <SelectValue placeholder="Select Priority" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                        <SelectItem value="Hot" className="font-bold text-rose-600">🔥 Hot</SelectItem>
                        <SelectItem value="Warm" className="font-bold text-amber-600">☀️ Warm</SelectItem>
                        <SelectItem value="Cold" className="font-bold text-indigo-600">❄️ Cold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Follow-up Date</label>
                    <Input 
                      type="date" 
                      className="h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm shadow-inner"
                      value={editingLead.followUpDate || ''}
                      onChange={e => {
                        const date = e.target.value;
                        setEditingLead({
                          ...editingLead, 
                          followUpDate: date,
                          status: date ? 'Follow-up Scheduled' : editingLead.status
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {LEAD_TAGS.map(tag => (
                    <Badge 
                      key={tag} 
                      variant={editingLead.tags?.includes(tag) ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                        editingLead.tags?.includes(tag) ? TAG_COLORS[tag] + " border-transparent shadow-sm" : "text-slate-400 border-slate-200 dark:border-slate-800"
                      )}
                      onClick={() => {
                        const currentTags = editingLead.tags || [];
                        const nextTags = currentTags.includes(tag) 
                          ? currentTags.filter(t => t !== tag) 
                          : [...currentTags, tag];
                        setEditingLead({...editingLead, tags: nextTags});
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Record Notes</label>
                <textarea 
                  className="w-full min-h-[120px] p-5 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white outline-none shadow-inner"
                  value={editingLead.notes || ''}
                  onChange={e => setEditingLead({...editingLead, notes: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleUpdateLead} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]">
                  Update Lead Record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Lead Detail Slide-over Panel */}
      <AnimatePresence>
        {isDetailsOpen && selectedLead && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[39]"
              onClick={() => setIsDetailsOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[1100px] bg-white shadow-[0_0_60px_rgba(15,23,42,0.18)] z-40 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 pt-7 pb-6 bg-white border-b border-slate-100">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-5 min-w-0 flex-1">
                    <Avatar className="w-20 h-20 rounded-2xl shadow-sm shrink-0">
                      <AvatarFallback className="bg-[#5B3FFF] text-white text-2xl font-bold rounded-2xl">
                        {(selectedLead?.companyName || selectedLead?.name || '?').slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-2.5 pt-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight truncate">
                          {selectedLead?.companyName || selectedLead?.name || 'Untitled Lead'}
                        </h2>
                        <Badge className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border-none",
                          (!!selectedLead?.companyName && selectedLead.companyName.trim().length > 0)
                            ? "bg-[#5B3FFF]/10 text-[#5B3FFF]"
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {(!!selectedLead?.companyName && selectedLead.companyName.trim().length > 0) ? 'Company' : 'Individual'}
                        </Badge>
                      </div>
                      {selectedLead?.companyName && selectedLead?.name && (
                        <p className="text-sm font-medium text-slate-500">{selectedLead.name}</p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap text-[12px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {selectedLead?.city || 'Location not set'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Created {selectedLead?.createdAt ? format(parseISO(selectedLead.createdAt), 'MMM d, yyyy') : '—'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {selectedLead?.source || 'Direct'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Action toolbar */}
                <div className="flex items-center gap-2.5 mt-6">
                  <Button
                    variant="outline"
                    className="h-10 px-4 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#5B3FFF] hover:border-[#5B3FFF]/30 font-semibold text-[13px] gap-2 shadow-sm"
                    onClick={() => selectedLead?.phone && window.open(`tel:${selectedLead.phone}`)}
                  >
                    <Phone className="w-4 h-4" /> Call
                  </Button>
                  <Button
                    className="h-10 px-4 rounded-lg bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold text-[13px] gap-2 border-none shadow-sm shadow-emerald-500/20"
                    onClick={() => selectedLead && handleWhatsAppFollowUp(selectedLead)}
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 px-4 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 font-semibold text-[13px] gap-2 shadow-sm"
                    onClick={() => selectedLead && handleEmail(selectedLead)}
                  >
                    <Mail className="w-4 h-4" /> Email
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-lg border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-sm"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-lg w-48">
                      <DropdownMenuItem
                        className="rounded-lg gap-2 font-medium text-sm cursor-pointer"
                        onClick={() => { setEditingLead({ ...selectedLead }); setIsEditDialogOpen(true); }}
                      >
                        <Edit2 className="w-4 h-4" /> Edit Lead
                      </DropdownMenuItem>
                      {selectedLead?.phone && (
                        <DropdownMenuItem
                          className="rounded-lg gap-2 font-medium text-sm cursor-pointer"
                          onClick={() => { navigator.clipboard.writeText(selectedLead.phone); toast.success('Phone copied'); }}
                        >
                          <Copy className="w-4 h-4" /> Copy Phone
                        </DropdownMenuItem>
                      )}
                      {selectedLead?.email && (
                        <DropdownMenuItem
                          className="rounded-lg gap-2 font-medium text-sm cursor-pointer"
                          onClick={() => { navigator.clipboard.writeText(selectedLead.email!); toast.success('Email copied'); }}
                        >
                          <Copy className="w-4 h-4" /> Copy Email
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="rounded-lg gap-2 font-medium text-sm text-rose-600 cursor-pointer"
                        onClick={() => { setLeadToDelete(selectedLead.id); setIsDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" /> Delete Lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Tabs + Body */}
              <div className="flex-1 flex overflow-hidden bg-[#F8F9FB]">
                {/* Main column with tabs */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-8 pt-5 bg-white border-b border-slate-100">
                      <TabsList className="bg-transparent p-0 h-auto gap-0 border-b-0 rounded-none w-auto justify-start">
                        <TabsTrigger
                          value="overview"
                          className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#5B3FFF] data-[state=active]:text-[#5B3FFF] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-[13px] font-semibold text-slate-500 hover:text-slate-700"
                        >
                          Overview
                        </TabsTrigger>
                        <TabsTrigger
                          value="activity"
                          className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#5B3FFF] data-[state=active]:text-[#5B3FFF] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-[13px] font-semibold text-slate-500 hover:text-slate-700"
                        >
                          Activity
                        </TabsTrigger>
                        <TabsTrigger
                          value="notes"
                          className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#5B3FFF] data-[state=active]:text-[#5B3FFF] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-[13px] font-semibold text-slate-500 hover:text-slate-700"
                        >
                          Notes
                          {notes.length > 0 && (
                            <span className="ml-2 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{notes.length}</span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="files"
                          className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#5B3FFF] data-[state=active]:text-[#5B3FFF] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-[13px] font-semibold text-slate-500 hover:text-slate-700"
                        >
                          Files
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
                      {/* OVERVIEW */}
                      <TabsContent value="overview" className="mt-0 space-y-5">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Requirement</h3>
                          {(selectedLead?.products || []).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {(selectedLead?.products || []).map((p, i) => (
                                <div key={i} className="inline-flex items-center gap-2 bg-[#5B3FFF]/5 border border-[#5B3FFF]/15 rounded-lg px-3 py-2">
                                  <Tag className="w-3.5 h-3.5 text-[#5B3FFF]" />
                                  <span className="text-[13px] font-semibold text-slate-800">{p.name}</span>
                                  <span className="text-[11px] font-bold text-[#5B3FFF] bg-white rounded px-2 py-0.5 border border-[#5B3FFF]/20">×{p.quantity}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 italic">No products added yet</p>
                          )}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Address</h3>
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-rose-500" />
                            </div>
                            <div className="text-sm font-medium text-slate-700 leading-relaxed pt-1.5">
                              {selectedLead?.address || selectedLead?.city || 'No address provided'}
                            </div>
                          </div>
                        </div>

                        {selectedLead?.tags && selectedLead.tags.length > 0 && (
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedLead.tags.map(tag => (
                                <Badge key={tag} className={cn("rounded-full px-3 py-1 text-[11px] font-semibold border-none", TAG_COLORS[tag] || "bg-slate-100 text-slate-700")}>
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedLead?.followUpDate && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Follow-up Scheduled</p>
                              <p className="text-sm font-bold text-amber-900">{format(parseISO(selectedLead.followUpDate), 'EEEE, MMMM d, yyyy')}</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* ACTIVITY */}
                      <TabsContent value="activity" className="mt-0">
                        {leadActivities.length === 0 ? (
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                              <Activity className="w-7 h-7 text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">No activity yet</p>
                            <p className="text-xs text-slate-400 mt-1">Updates and changes will appear here</p>
                          </div>
                        ) : (
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="relative space-y-5 pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                              {(leadActivities || []).map((log) => {
                                let when = '';
                                try {
                                  if (log.createdAt) when = format(parseISO(log.createdAt), 'MMM d, yyyy • h:mm a');
                                } catch (e) { when = ''; }
                                const action = log.action || '';
                                const Icon = action.includes('Note') ? FileText :
                                  action.includes('Status') ? CheckCircle2 :
                                  action.includes('Edit') || action.includes('Update') ? Edit2 :
                                  action.includes('Created') ? UserPlus :
                                  Activity;
                                return (
                                  <div key={log.id} className="relative">
                                    <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center">
                                      <Icon className="w-3 h-3 text-[#5B3FFF]" />
                                    </div>
                                    <div className="pl-3">
                                      <p className="text-[13px] font-semibold text-slate-800">{action}</p>
                                      {log.details && <p className="text-xs text-slate-500 mt-0.5">{log.details}</p>}
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[11px] font-medium text-slate-400">{getUserName(log.userId, users)}</span>
                                        {when && <span className="text-slate-300 text-xs">•</span>}
                                        {when && <span className="text-[11px] text-slate-400">{when}</span>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* NOTES */}
                      <TabsContent value="notes" className="mt-0 space-y-5">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                          <textarea
                            className="w-full min-h-[90px] bg-transparent border-none text-slate-800 font-medium text-sm focus:ring-0 resize-none outline-none placeholder:text-slate-400 leading-relaxed"
                            placeholder="Add a note..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                          />
                          {isFollowUpNote && (
                            <div className="mt-2 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-500" />
                              <Input
                                type="date"
                                className="h-9 w-[180px] rounded-lg border-slate-200 bg-white text-xs font-semibold"
                                value={noteFollowUpDate}
                                onChange={(e) => setNoteFollowUpDate(e.target.value)}
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100">
                            <Button
                              variant="ghost"
                              className={cn(
                                "h-9 px-3 rounded-lg font-semibold text-[12px] gap-2",
                                isFollowUpNote
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                              )}
                              onClick={() => setIsFollowUpNote(!isFollowUpNote)}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              {isFollowUpNote ? 'Follow-up set' : 'Schedule Follow-up'}
                            </Button>
                            <Button
                              onClick={handleAddNote}
                              disabled={!newNote.trim() || isSavingNote}
                              className="h-9 px-5 rounded-lg bg-[#5B3FFF] hover:bg-[#4a32d6] text-white font-semibold text-[12px] gap-2 shadow-sm shadow-[#5B3FFF]/20 disabled:opacity-40"
                            >
                              {isSavingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                              Add Note
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {notes.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                              <p className="text-sm font-semibold text-slate-500">No notes yet</p>
                              <p className="text-xs text-slate-400 mt-1">Capture conversations and follow-ups</p>
                            </div>
                          ) : (
                            (notes || []).map((note) => (
                              <motion.div
                                layout
                                key={note.id}
                                className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8 rounded-lg shrink-0">
                                      <AvatarFallback className="bg-[#5B3FFF]/10 text-[#5B3FFF] font-bold text-xs rounded-lg">
                                        {(getUserName(note.createdBy, users)?.slice(0, 1) || '?').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-[13px] font-semibold text-slate-800 leading-tight">{getUserName(note.createdBy, users)}</p>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {note.createdAt ? format(parseISO(note.createdAt), 'MMM d, yyyy • h:mm a') : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => { setNoteToDeleteId(note.id); setIsNoteDeleteDialogOpen(true); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{note.note}</p>
                                {note.followUpDate && (
                                  <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[11px] font-semibold px-2.5 py-1 rounded-md">
                                    <Clock className="w-3 h-3" />
                                    Follow-up {format(parseISO(note.followUpDate), 'MMM d, yyyy')}
                                  </div>
                                )}
                              </motion.div>
                            ))
                          )}
                        </div>
                      </TabsContent>

                      {/* FILES */}
                      <TabsContent value="files" className="mt-0">
                        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                            <Paperclip className="w-8 h-8 text-slate-300" />
                          </div>
                          <h3 className="text-base font-bold text-slate-700 mb-1">No files yet</h3>
                          <p className="text-sm text-slate-400">File attachments coming soon</p>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>

                {/* Right sidebar */}
                <aside className="w-[320px] shrink-0 bg-white border-l border-slate-100 overflow-y-auto p-6 space-y-5">
                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact Info</h3>
                    <div className="bg-[#F8F9FB] rounded-xl border border-slate-100 p-4 space-y-3.5">
                      <div className="flex items-start gap-3">
                        <UserIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</p>
                          <p className="text-[13px] font-semibold text-slate-800 truncate">{selectedLead?.name || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                          <a
                            href={selectedLead?.phone ? `tel:${selectedLead.phone}` : undefined}
                            className="text-[13px] font-semibold text-slate-800 hover:text-[#5B3FFF] truncate block"
                          >
                            {selectedLead?.phone || '—'}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                          {selectedLead?.email ? (
                            <a
                              href={`mailto:${selectedLead.email}`}
                              className="text-[13px] font-semibold text-slate-800 hover:text-[#5B3FFF] truncate block"
                            >
                              {selectedLead.email}
                            </a>
                          ) : (
                            <p className="text-[13px] text-slate-400 italic">Not provided</p>
                          )}
                        </div>
                      </div>
                      {selectedLead?.companyName && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company</p>
                            <p className="text-[13px] font-semibold text-slate-800 truncate">{selectedLead.companyName}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                          <p className="text-[13px] font-semibold text-slate-800 truncate">{selectedLead?.city || selectedLead?.address || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lead Details */}
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lead Details</h3>
                    <div className="bg-[#F8F9FB] rounded-xl border border-slate-100 p-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                        <StatusSelector
                          selectedStatus={selectedLead?.status || 'New'}
                          statuses={statuses}
                          onStatusChange={(s) => selectedLead && handleUpdateStatus(selectedLead.id, s)}
                          size="sm"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source</p>
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-[#5B3FFF]" />
                          <span className="text-[13px] font-semibold text-slate-800">{selectedLead?.source || 'Direct'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Requirement</p>
                        {(selectedLead?.products || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedLead?.products || []).slice(0, 3).map((p, i) => (
                              <Badge key={i} className="bg-[#5B3FFF]/10 text-[#5B3FFF] border-none text-[10px] font-semibold px-2 py-1 rounded-md">
                                {p.name} ×{p.quantity}
                              </Badge>
                            ))}
                            {(selectedLead?.products || []).length > 3 && (
                              <Badge className="bg-slate-100 text-slate-600 border-none text-[10px] font-semibold px-2 py-1 rounded-md">
                                +{(selectedLead?.products || []).length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <p className="text-[12px] text-slate-400 italic">None</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assigned To</p>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6 rounded-md">
                            <AvatarFallback className="bg-[#5B3FFF] text-white font-bold text-[10px] rounded-md">
                              {getUserAvatar(selectedLead?.assignedTo, users)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[13px] font-semibold text-slate-800 truncate">
                            {getUserName(selectedLead?.assignedTo, users) || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                      {selectedLead?.priority && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</p>
                          <Badge className={cn(
                            "border-none text-[10px] font-semibold px-2 py-1 rounded-md",
                            selectedLead.priority === 'Hot' ? 'bg-rose-100 text-rose-700' :
                            selectedLead.priority === 'Warm' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          )}>
                            <Zap className="w-3 h-3 mr-1" />
                            {selectedLead.priority}
                          </Badge>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created</p>
                        <p className="text-[13px] font-semibold text-slate-800">
                          {selectedLead?.createdAt ? format(parseISO(selectedLead.createdAt), 'MMM d, yyyy') : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[400px] dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add New Product</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-slate-300">Product Name</label>
              <Input 
                placeholder="Enter product name" 
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                autoFocus
                className="dark:bg-slate-950 dark:border-slate-800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProductOpen(false)} className="dark:border-slate-800 dark:text-slate-400">Cancel</Button>
            <Button onClick={handleCreateProduct} className="bg-blue-600 hover:bg-blue-700">Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Statuses Dialog */}
      <Dialog open={isManageStatusesOpen} onOpenChange={setIsManageStatusesOpen}>
        <DialogContent className="sm:max-w-[500px] dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Manage Lead Statuses</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* Add New Status */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add New Status</h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="Status label (e.g. Demo Done)" 
                  value={newStatusLabel}
                  onChange={e => setNewStatusLabel(e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-800"
                />
                <Select value={newStatusColor} onValueChange={setNewStatusColor}>
                  <SelectTrigger className="w-[120px] dark:bg-slate-900 dark:border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_COLORS_MAP).map(color => (
                      <SelectItem key={color} value={color} className="capitalize">{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateStatus} size="icon" className="bg-blue-600 shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Status List */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Statuses</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {statuses.map((status) => (
                  <div key={status.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", 
                        status.color === 'slate' ? 'bg-slate-400' :
                        status.color === 'blue' ? 'bg-blue-500' :
                        status.color === 'amber' ? 'bg-amber-500' :
                        status.color === 'emerald' ? 'bg-emerald-500' :
                        status.color === 'rose' ? 'bg-rose-500' :
                        status.color === 'indigo' ? 'bg-indigo-500' :
                        status.color === 'purple' ? 'bg-purple-500' :
                        status.color === 'orange' ? 'bg-orange-500' :
                        status.color === 'green' ? 'bg-green-500' :
                        status.color === 'red' ? 'bg-red-500' : 'bg-slate-400'
                      )} />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{status.label}</span>
                    </div>
                    {!status.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteStatus(status.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsManageStatusesOpen(false)} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 font-bold">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedLead && (
        <EmailModal 
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          lead={selectedLead}
        />
      )}

      {selectedLead && (
        <WhatsAppModal 
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          lead={selectedLead}
        />
      )}
      {/* Bulk Delete Confirmation */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="rounded-[32px] p-8">
          <DialogHeader>
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Move to Recycle Bin</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold text-sm">
              Are you sure you want to move {selectedLeadIds.length} selected leads to the recycle bin? You can restore them later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-8">
            <Button variant="ghost" className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20" onClick={handleBulkDelete} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Move to Recycle Bin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-[32px] p-8">
          <DialogHeader>
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Move to Recycle Bin</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold text-sm">
              Are you sure you want to move this lead to the recycle bin? You can restore it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-8">
            <Button variant="ghost" className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20" onClick={handleDeleteLead} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Move to Recycle Bin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Delete Confirmation */}
      <Dialog open={isProductDeleteDialogOpen} onOpenChange={setIsProductDeleteDialogOpen}>
        <DialogContent className="rounded-[32px] p-8">
          <DialogHeader>
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Delete Product</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold text-sm">
              Are you sure you want to permanently delete "{productToDelete?.name}" from the master product list? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-8">
            <Button variant="ghost" className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]" onClick={() => setIsProductDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20" 
              onClick={async () => {
                if (productToDelete) {
                  await deleteProduct(productToDelete.id);
                  setIsProductDeleteDialogOpen(false);
                  setProductToDelete(null);
                  toast.success('Product deleted from master list');
                }
              }}
            >
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Delete Confirmation */}
      <Dialog open={isNoteDeleteDialogOpen} onOpenChange={setIsNoteDeleteDialogOpen}>
        <DialogContent className="rounded-[32px] p-8">
          <DialogHeader>
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Delete Note</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold text-sm">
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-8">
            <Button variant="ghost" className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]" onClick={() => setIsNoteDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20" 
              onClick={async () => {
                if (noteToDeleteId) {
                  await deleteNote(noteToDeleteId);
                  setIsNoteDeleteDialogOpen(false);
                  setNoteToDeleteId(null);
                  toast.success('Note deleted');
                }
              }}
            >
              Delete Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ActivityTimeline: React.FC<{ leadId: string; activities: ActivityLog[]; notes: Note[] }> = ({ leadId, activities, notes }) => {
  const allTimelineItems = [
    ...(activities || []).map(a => {
      let date: Date;
      try {
        date = a.createdAt ? parseISO(a.createdAt) : new Date();
        if (isNaN(date.getTime())) date = new Date();
      } catch (e) {
        date = new Date();
      }
      return {
        id: a.id,
        type: 'activity',
        date: date,
        content: a.action,
        userId: a.userId,
        icon: (a.action || '').includes('Status') ? AlertCircle : Zap
      };
    }),
    ...(notes || []).map(n => {
      let date: Date;
      try {
        date = n.createdAt ? parseISO(n.createdAt) : new Date();
        if (isNaN(date.getTime())) date = new Date();
      } catch (e) {
        date = new Date();
      }
      return {
        id: n.id,
        type: 'note',
        date: date,
        content: n.note,
        userId: n.createdBy,
        icon: FileText
      };
    })
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6 py-4">
      {allTimelineItems.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">No activity recorded yet</p>
        </div>
      ) : (
        <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-slate-800">
          {(allTimelineItems || []).map((item) => (
            <div key={`${item.type}-${item.id}`} className="relative">
              <div className={cn(
                "absolute -left-8 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm z-10",
                item.type === 'note' ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30"
              )}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {item.date instanceof Date && !isNaN(item.date.getTime()) 
                      ? format(item.date, 'MMM d, yyyy') 
                      : 'Unknown Date'}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight">
                    {item.type}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leads;
