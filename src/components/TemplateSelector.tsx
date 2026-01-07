import type { TemplateId } from '@/types/page.types';
import { TEMPLATES } from '@/constants/templates';

type TemplateSelectorProps = {
  selectedTemplateId: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
  onLoadTemplate: () => void;
  busy: boolean;
};

export function TemplateSelector({
  selectedTemplateId,
  onTemplateChange,
  onLoadTemplate,
  busy,
}: TemplateSelectorProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Gateway type</span>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onTemplateChange(template.id)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                selectedTemplateId === template.id
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
              }`}
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onLoadTemplate}
        disabled={busy}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Carrega plantilla
      </button>
    </div>
  );
}
