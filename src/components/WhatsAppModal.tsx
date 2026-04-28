import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MessageCircle, Send, Copy, Check } from 'lucide-react';
import { Lead } from '../types/crm';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

const WHATSAPP_TEMPLATES = [
  {
    id: 'quotation',
    name: 'Quotation Sent',
    text: `Hello {{name}},
We have shared the quotation with you. Kindly review it and let us know your valuable feedback.
If you need any technical support, feel free to call us.
Thank you,
A V Corporation`
  },
  {
    id: 'follow-up',
    name: 'Follow-up Reminder',
    text: `Hello {{name}},
Just following up regarding our previous discussion. Kindly let us know your update.
Looking forward to your response.
Thank you.`
  },
  {
    id: 'meeting',
    name: 'Meeting Request',
    text: `Hello {{name}},
We would like to schedule a quick meeting with you regarding your requirement.
Please let us know a suitable time.
Thank you.`
  },
  {
    id: 'payment',
    name: 'Payment Reminder',
    text: `Hello {{name}},
This is a gentle reminder regarding the pending payment.
Kindly process the same at your earliest convenience.
Thank you.`
  },
  {
    id: 'inquiry',
    name: 'General Inquiry',
    text: `Hello {{name}},
Thank you for your inquiry. Our team will get back to you shortly with complete details.
Thank you.`
  }
];

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, lead }) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && lead) {
      // Default to first template
      applyTemplate(WHATSAPP_TEMPLATES[0].id);
    }
  }, [isOpen, lead]);

  const replacePlaceholders = (text: string) => {
    if (!lead) return text;
    return text
      .replace(/{{name}}/g, lead.name)
      .replace(/{{company}}/g, lead.companyName || 'your company')
      .replace(/{{product}}/g, lead.product || 'the requirement');
  };

  const applyTemplate = (templateId: string) => {
    const template = WHATSAPP_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessage(replacePlaceholders(template.text));
    }
  };

  const handleSend = () => {
    if (!lead) return;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">WhatsApp Message</DialogTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Send a template to {lead.name}</p>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Template</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {WHATSAPP_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all group",
                    selectedTemplate === template.id 
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                      : "border-slate-100 dark:border-slate-800 hover:border-green-200 dark:hover:border-green-900/40 bg-slate-50 dark:bg-slate-950"
                  )}
                >
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    selectedTemplate === template.id ? "text-green-600" : "text-slate-400 group-hover:text-slate-600"
                  )}>
                    {template.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Preview</label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopy}
                className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600"
              >
                {copied ? <Check className="w-3 h-3 mr-1.5" /> : <Copy className="w-3 h-3 mr-1.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              className="min-h-[180px] rounded-3xl border-none bg-slate-50 dark:bg-slate-950 p-6 font-bold text-sm focus:ring-2 focus:ring-green-500/20 transition-all resize-none dark:text-white outline-none shadow-inner"
            />
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
            className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-10 h-12 font-black text-xs uppercase tracking-widest shadow-xl shadow-green-600/20 transition-all active:scale-[0.98] flex items-center gap-3"
          >
            <Send className="w-4 h-4" />
            Send to WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppModal;
