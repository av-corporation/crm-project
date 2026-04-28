import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Lead } from '../types/crm';
import { format, isSameDay, parseISO, isPast, isToday } from 'date-fns';
import { cn } from '../lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Button } from './ui/button';
import { Phone, MessageSquare, User, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Badge } from './ui/badge';

interface FollowUpCalendarProps {
  leads: Lead[];
  onDateClick: (date: Date) => void;
}

const FollowUpCalendar: React.FC<FollowUpCalendarProps> = ({ leads, onDateClick }) => {
  const [value, setValue] = useState(new Date());
  const [selectedDateLeads, setSelectedDateLeads] = useState<Lead[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getDayLeads = (date: Date) => {
    return (leads || []).filter(l => {
      if (!l || !l.followUpDate) return false;
      try {
        const d = parseISO(l.followUpDate);
        return !isNaN(d.getTime()) && isSameDay(d, date);
      } catch (e) {
        return false;
      }
    });
  };

  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dayLeads = getDayLeads(date);
      if (dayLeads.length > 0) {
        return (
          <div className="flex flex-col items-center mt-1">
            <span className="text-[10px] font-black bg-blue-600 text-white w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
              {dayLeads.length}
            </span>
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dayLeads = getDayLeads(date);
      if (dayLeads.length > 0) {
        const hasOverdue = dayLeads.some(l => {
          if (!l || !l.followUpDate) return false;
          try {
            const d = parseISO(l.followUpDate);
            return !isNaN(d.getTime()) && isPast(d) && !isToday(d);
          } catch (e) { return false; }
        });
        const hasToday = dayLeads.some(l => {
          if (!l || !l.followUpDate) return false;
          try {
            const d = parseISO(l.followUpDate);
            return !isNaN(d.getTime()) && isToday(d);
          } catch (e) { return false; }
        });
        
        if (hasOverdue) return 'has-overdue';
        if (hasToday) return 'has-today';
        return 'has-followup';
      }
    }
    return null;
  };

  const handleDateClick = (date: Date) => {
    const dayLeads = getDayLeads(date);
    if (dayLeads.length > 0) {
      setSelectedDateLeads(dayLeads);
      setIsDetailsOpen(true);
    }
    onDateClick(date);
  };

  return (
    <div className="followup-calendar-container bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <Calendar
        onChange={(val) => {
          if (val instanceof Date) {
            setValue(val);
            handleDateClick(val);
          }
        }}
        value={value}
        tileContent={tileContent}
        tileClassName={tileClassName}
        className="w-full border-none font-sans"
      />

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl dark:bg-slate-950">
          <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Follow-ups for {format(value, 'MMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 max-h-[400px] overflow-y-auto space-y-3 bg-white dark:bg-slate-950">
            {selectedDateLeads.map((lead) => (
              <div 
                key={lead.id} 
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{lead.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {lead.followUpDate && (function() {
                            try {
                              const d = parseISO(lead.followUpDate);
                              return isNaN(d.getTime()) ? 'N/A' : format(d, 'h:mm a');
                            } catch (e) {
                              return 'N/A';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-2">
                    {lead.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9 rounded-lg font-bold text-xs border-slate-200 dark:border-slate-700"
                    onClick={() => window.top.location.href = `tel:${lead.phone}`}
                  >
                    <Phone className="w-3 h-3 mr-2" />
                    Call
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9 rounded-lg font-bold text-xs border-green-100 text-green-600 hover:bg-green-50 dark:border-green-900/30 dark:hover:bg-green-900/20"
                    onClick={() => {
                      const msg = `Hi ${lead.name}, following up regarding our discussion.`;
                      const url = `https://api.whatsapp.com/send?phone=91${lead.phone}&text=${encodeURIComponent(msg)}`;
                      window.top.location.href = url;
                    }}
                  >
                    <MessageSquare className="w-3 h-3 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .followup-calendar-container .react-calendar {
          background: transparent;
          border: none;
          width: 100%;
        }
        .followup-calendar-container .react-calendar__navigation {
          margin-bottom: 1rem;
          display: flex;
          gap: 0.5rem;
        }
        .followup-calendar-container .react-calendar__navigation button {
          color: var(--slate-900);
          font-weight: 800;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: 0.75rem;
          min-width: 36px;
        }
        .dark .followup-calendar-container .react-calendar__navigation button {
          color: white;
        }
        .followup-calendar-container .react-calendar__navigation button:hover {
          background-color: #f1f5f9;
        }
        .dark .followup-calendar-container .react-calendar__navigation button:hover {
          background-color: #1e293b;
        }
        .followup-calendar-container .react-calendar__month-view__weekdays__weekday {
          text-transform: uppercase;
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--slate-400);
          text-decoration: none;
          padding: 0.5rem;
        }
        .followup-calendar-container .react-calendar__tile {
          padding: 1rem 0.25rem;
          font-weight: 700;
          font-size: 0.85rem;
          border-radius: 0.75rem;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
        }
        .dark .followup-calendar-container .react-calendar__tile {
          color: #94a3b8;
        }
        .followup-calendar-container .react-calendar__tile:hover {
          background-color: #f1f5f9 !important;
          transform: scale(1.05);
        }
        .dark .followup-calendar-container .react-calendar__tile:hover {
          background-color: #1e293b !important;
        }
        .followup-calendar-container .react-calendar__tile--active {
          background: #2563eb !important;
          color: white !important;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
        }
        .followup-calendar-container .react-calendar__tile--now {
          background: #eff6ff;
          color: #2563eb;
          border: 2px solid #2563eb;
        }
        .dark .followup-calendar-container .react-calendar__tile--now {
          background: #1e293b;
          color: #60a5fa;
          border-color: #60a5fa;
        }
        .followup-calendar-container .has-followup {
          color: #2563eb !important;
        }
        .dark .followup-calendar-container .has-followup {
          color: #60a5fa !important;
        }
        .followup-calendar-container .has-overdue {
          background-color: #fef2f2 !important;
          color: #dc2626 !important;
        }
        .dark .followup-calendar-container .has-overdue {
          background-color: #450a0a !important;
          color: #f87171 !important;
        }
        .followup-calendar-container .has-today {
          background-color: #eff6ff !important;
          color: #2563eb !important;
        }
        .dark .followup-calendar-container .has-today {
          background-color: #1e3a8a !important;
          color: #60a5fa !important;
        }
      `}</style>
    </div>
  );
};

export default FollowUpCalendar;
