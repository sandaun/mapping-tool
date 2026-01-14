import type { TemplateId } from '@/types/page.types';
import { TEMPLATES } from '@/constants/templates';
import { Button } from '@/components/ui/button';
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
            <Button
              key={template.id}
              type="button"
              onClick={() => handleTemplateClick(template.id)}
              disabled={busy}
              variant={isActive ? 'default' : 'outline'}
              className={`${
                isActive ? 'shadow-lg ring-2 ring-primary/20' : ''
              }`}
            >
              {template.label}
            </Button>
          );
        })}

        {/* Botó Custom */}
        <Button
          type="button"
          onClick={handleCustomClick}
          disabled={busy}
          variant="outline"
          className="gap-2"
        >
          📁 Custom
        </Button>

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
