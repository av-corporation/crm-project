import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Mail, Send, FileText, Quote, Bell } from 'lucide-react';
import { Lead } from '../types/crm';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

const TEMPLATES = [
  {
    id: 'quotation',
    name: 'Standard Response',
    icon: <Quote className="w-4 h-4" />,
    subject: 'Regarding Your Requirement - AV CORPORATION',
    body: (name: string, company?: string, product?: string) => `Dear ${name},

Thank you for your interest in AV CORPORATION.

We have received your requirement for ${product || 'your specified products'}. Our team is reviewing the details and will get back to you shortly with a formal quotation.

In the meantime, feel free to reply to this email if you have any questions.

Best Regards,
Team AV CORPORATION`
  }
];

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, lead }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lead) {
      applyTemplate('quotation');
    }
  }, [isOpen, lead]);

  if (!lead) return null;

  const handleSend = () => {
    if (!lead.email) {
      toast.error('Lead does not have an email address');
      return;
    }

    const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
    toast.success('Email client opened');
    onClose();
  };

  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      setMessage(template.body(lead.name, lead.companyName, lead.product));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Send Email</DialogTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Compose email to {lead.name}</p>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Templates</label>
            <div className="flex flex-wrap gap-3">
              {TEMPLATES.map(template => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template.id)}
                  className={cn(
                    "h-10 px-5 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                    selectedTemplate === template.id 
                      ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20" 
                      : "border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40"
                  )}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
              <Input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="h-12 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white outline-none shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Body</label>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your email content here..."
                className="min-h-[300px] rounded-3xl border-none bg-slate-50 dark:bg-slate-950 p-6 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white outline-none shadow-inner"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 px-8"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 h-12 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center gap-3"
          >
            <Send className="w-4 h-4" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailModal;
