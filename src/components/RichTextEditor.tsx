import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from '../lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet'
  ];

  return (
    <div className={cn("rich-text-editor", className)}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white dark:bg-slate-900 dark:text-white rounded-xl overflow-hidden border-slate-200 dark:border-slate-800"
      />
      <style>{`
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-color: var(--border-slate-200);
          background-color: #f8fafc;
        }
        .dark .rich-text-editor .ql-toolbar {
          border-color: #1e293b;
          background-color: #0f172a;
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: var(--border-slate-200);
          min-height: 150px;
          font-family: inherit;
        }
        .dark .rich-text-editor .ql-container {
          border-color: #1e293b;
        }
        .dark .ql-snow .ql-stroke {
          stroke: #94a3b8;
        }
        .dark .ql-snow .ql-fill {
          fill: #94a3b8;
        }
        .dark .ql-snow .ql-picker {
          color: #94a3b8;
        }
        .dark .ql-editor.ql-blank::before {
          color: #475569;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
