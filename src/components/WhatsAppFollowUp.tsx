import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { MessageSquare, Send } from 'lucide-react';
import { Lead } from '../types/crm';

interface WhatsAppFollowUpProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FOLLOW_UP_TEMPLATES = [
  { id: 'init', label: '1. Initial Contact', text: 'Hello {{name}}, this is from {{company}}. Following up regarding your requirement for {{product}}. Please let me know if you\'re interested.' },
  { id: 'quote-sent', label: '2. Quotation Sent', text: 'Hello {{name}}, we have shared the quotation for {{product}}. Please let us know your feedback.' },
  { id: 'quote-rem', label: '3. Quotation Reminder', text: 'Hi {{name}}, just following up on the quotation for {{product}}. Any update?' },
  { id: 'interest', label: '4. Interest Check', text: 'Hello {{name}}, just checking if you\'re still interested in {{product}}.' },
  { id: 'follow-up-rem', label: '5. Follow-up Reminder', text: 'Hi {{name}}, just a quick reminder regarding {{product}}. Waiting for your response.' },
  { id: 'offer', label: '6. Offer Push', text: 'Hello {{name}}, we can offer you the best price for {{product}}. Let’s connect.' },
  { id: 'final', label: '7. Final Follow-up', text: 'Hello {{name}}, this is a final follow-up regarding {{product}}. Please let us know your decision.' },
  { id: 'hold', label: '8. Close or Hold', text: 'Hi {{name}}, should we keep your requirement for {{product}} on hold or proceed further?' },
  { id: 'reconnect', label: '9. Reconnect', text: 'Hello {{name}}, reconnecting regarding your earlier inquiry for {{product}}.' },
  { id: 'deal', label: '10. Deal Closing', text: 'Hi {{name}}, let’s finalize your requirement for {{product}}.' },
  { id: 'payment', label: '11. Payment Reminder', text: 'Hello {{name}}, please confirm payment for {{product}} so we can proceed.' },
  { id: 'closing', label: '12. Final Closing', text: 'Hi {{name}}, looking forward to closing this deal for {{product}}.' }
];

import { toast } from 'sonner';

const WhatsAppFollowUp: React.FC<WhatsAppFollowUpProps> = ({ lead, open, onOpenChange }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    return localStorage.getItem('last_whatsapp_template') || FOLLOW_UP_TEMPLATES[0].id;
  });
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    const template = FOLLOW_UP_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (template) {
      const message = template.text
        .replace(/{{name}}/g, lead?.name || 'Customer')
        .replace(/{{product}}/g, lead?.product || 'our products')
        .replace(/{{company}}/g, 'AV Corporation');
      setCustomMessage(message);
    }
  }, [selectedTemplateId, lead]);

  const handleSend = async () => {
    localStorage.setItem('last_whatsapp_template', selectedTemplateId);
    
    // Copy to clipboard for best UX
    try {
      await navigator.clipboard.writeText(customMessage);
      toast.success('Message copied. Just click Send on WhatsApp');
    } catch (err) {
      console.error('Failed to copy message:', err);
    }

    // Format phone: remove non-digits, ensure 91 prefix if needed
    let phone = lead.phone.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    
    const encodedMessage = encodeURIComponent(customMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    
    // Instant redirect outside iframe
    setTimeout(() => {
      try {
        window.top!.location.href = whatsappUrl;
      } catch (e) {
        window.open(whatsappUrl, '_blank');
      }
      onOpenChange(false);
    }, 500); // Small delay to let toast show
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            WhatsApp Follow-up
          </DialogTitle>
          <DialogDescription>
            Select a template and send instantly. The message will be copied to your clipboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Select Template</label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {FOLLOW_UP_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Message Preview & Edit</label>
            <textarea 
              className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm shadow-sm"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message here..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg shadow-green-600/20 font-bold"
          >
            <Send className="w-4 h-4" />
            Send WhatsApp (1 Click)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppFollowUp;
