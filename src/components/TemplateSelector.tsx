import type { TemplateId } from '@/types/page.types';
import { TEMPLATES } from '@/constants/templates';
import { useRef } from 'react';

type TemplateSelectorProps = {
  selectedTemplateId: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
  onLoadTemplate: (templateId: TemplateId) => void;
  onCustomFileSelect: (file: File) => void;
  busy: boolean;
};

export function TemplateSelector({
  selectedTemplateId,
  onTemplateChange,
  onLoadTemplate,
  onCustomFileSelect,
  busy,
}: TemplateSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTemplateClick = async (templateId: TemplateId) => {
    onTemplateChange(templateId);
    await onLoadTemplate(templateId);
  };

  const handleCustomClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCustomFileSelect(file);
      // Reset input per permetre seleccionar el mateix fitxer després
      e.target.value = '';
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">
        Gateway Template
      </span>
      <div className="flex flex-wrap gap-3">
        {TEMPLATES.map((template) => {
          const isActive = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleTemplateClick(template.id)}
              disabled={busy}
              className={
                isActive
                  ? 'px-4 py-2 text-xs font-semibold rounded-lg border border-primary bg-primary/5 text-primary shadow-sm dark:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-primary/50 hover:text-primary dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              }
            >
              {template.label}
            </button>
          );
        })}

        {/* Botó Custom */}
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={busy}
          className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-primary/50 hover:text-primary dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed gap-2 inline-flex items-center"
        >
          📁 Custom
        </button>

        {/* Input file ocult */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
