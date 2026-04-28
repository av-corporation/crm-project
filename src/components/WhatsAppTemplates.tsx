import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { MessageCircle, ChevronDown } from 'lucide-react';
import { Lead } from '../types/crm';
import { toast } from 'sonner';

interface WhatsAppTemplatesProps {
  lead: Lead;
  companyName: string;
}

const WhatsAppTemplates: React.FC<WhatsAppTemplatesProps> = ({ lead, companyName }) => {
  const templates = [
    {
      name: 'Quotation Follow-up',
      text: `Hi ${lead.name}, this is Shaikh from A V Corporation. I hope you received the quotation for the ${lead.product || 'cleaning machine'}. Let me know if you have any questions or if we can proceed with the order.`
    },
    {
      name: 'General Follow-up',
      text: `Hi ${lead.name}, this is Shaikh from A V Corporation. Following up regarding our previous discussion. Please let me know if you need any further information.`
    },
    {
      name: 'Requirement Check',
      text: `Hi ${lead.name}, this is Shaikh from A V Corporation. Following up regarding your requirement for ${lead.product || 'cleaning solutions'}. How would you like to proceed?`
    }
  ];

  const handleSend = (text: string) => {
    const msg = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?phone=91${lead.phone}&text=${msg}`;
    
    // Open in same tab as requested
    window.location.href = url;
    toast.success('Redirecting to WhatsApp...');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between gap-2 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-900/30 dark:hover:bg-green-900/20 dark:hover:text-green-400 transition-all font-bold h-11 rounded-xl" />}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-600" />
          <span>Send WhatsApp</span>
        </div>
        <ChevronDown className="w-4 h-4 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 py-1">Select Template</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {templates.map((t, i) => (
            <DropdownMenuItem 
              key={i} 
              onClick={() => handleSend(t.text)}
              className="rounded-lg py-2.5 cursor-pointer"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-[10px] text-slate-500 line-clamp-1">{t.text}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WhatsAppTemplates;
