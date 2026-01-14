import type { TemplateId } from '@/types/page.types';
import { TEMPLATES } from '@/constants/templates';
import { Button } from '@/components/ui/button';

type TemplateSelectorProps = {
  selectedTemplateId: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
  onLoadTemplate: (templateId: TemplateId) => void;
  busy: boolean;
};

export function TemplateSelector({
  selectedTemplateId,
  onTemplateChange,
  onLoadTemplate,
  busy,
}: TemplateSelectorProps) {
  const handleTemplateClick = async (templateId: TemplateId) => {
    onTemplateChange(templateId);
    await onLoadTemplate(templateId);
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">Gateway Template</span>
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
      </div>
    </div>
  );
}
