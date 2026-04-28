import React, { useState, useMemo } from 'react';
import { 
  Check, 
  ChevronDown, 
  Search, 
  Plus, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './ui/popover';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { StatusConfig } from '../types/crm';

interface StatusSelectorProps {
  selectedStatus: string;
  statuses: StatusConfig[];
  onStatusChange: (status: string) => void;
  onAddStatus?: () => void;
  onRefresh?: () => void;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_COLORS_MAP: Record<string, string> = {
  'slate': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
  'blue': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  'amber': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  'emerald': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  'rose': 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
  'indigo': 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
  'purple': 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  'orange': 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  'green': 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  'red': 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
};

const StatusSelector: React.FC<StatusSelectorProps> = ({
  selectedStatus,
  statuses,
  onStatusChange,
  onAddStatus,
  onRefresh,
  className,
  disabled = false,
  isLoading = false,
  size = 'md'
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredStatuses = useMemo(() => {
    return (statuses || []).filter(s => 
      s.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [statuses, search]);

  const currentStatus = (statuses || []).find(s => s.label === selectedStatus);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className={cn(
              "justify-between rounded-full border transition-all px-4 group",
              size === 'sm' ? "h-7 px-3" : size === 'lg' ? "h-12 px-6" : "h-11 px-4",
              currentStatus ? STATUS_COLORS_MAP[currentStatus.color || 'slate'] : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
              className
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : null}
              <span className={cn(
                "truncate font-extrabold text-[10px] uppercase tracking-[0.2em]",
                currentStatus ? "" : "text-slate-400"
              )}>
                {selectedStatus || "Select Status"}
              </span>
            </div>
            <ChevronDown className={cn(
              "ml-1.5 h-3 w-3 shrink-0 opacity-50 transition-transform duration-200",
              open && "rotate-180"
            )} />
          </Button>
        }
      />
      <PopoverContent className="w-[280px] p-0 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden" align="start">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Status</span>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            )}
            {onAddStatus && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddStatus();
                }}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="p-2">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-500/20"
            />
          </div>

          <ScrollArea className="h-[240px]">
            <div className="space-y-1 pr-2">
              {filteredStatuses.map((status) => (
                <button
                  key={status.id}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group",
                    selectedStatus === status.label 
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                  )}
                  onClick={() => {
                    onStatusChange(status.label);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
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
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] truncate">{status.label}</span>
                  </div>
                  {selectedStatus === status.label && (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>
              ))}
              {filteredStatuses.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No status found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {onAddStatus && (
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-9 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl"
              onClick={() => {
                onAddStatus();
                setOpen(false);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Add New Status
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default StatusSelector;
