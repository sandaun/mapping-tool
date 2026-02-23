/**
 * TemplateSelector
 *
 * Each option is rendered as a protocol bridge row (internal → external),
 * so the template selection IS the protocol architecture display.
 * No separate "Protocol Architecture" block needed.
 */
import { useRef } from 'react';
import type { TemplateId } from '@/types/page.types';
import { TEMPLATES } from '@/constants/templates';
import {
  parseTemplateLabel,
  ProtocolColorBadge,
  RoleLabel,
} from '@/components/ProtocolsInfo';
import { ArrowRight, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

type TemplateSelectorProps = {
  selectedTemplateId: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
  onCustomFileSelect: (file: File) => void;
  busy: boolean;
};

// ---------------------------------------------------------------------------
// Sub-component: a single selectable template row rendered as a bridge
// ---------------------------------------------------------------------------

function TemplateBridgeOption({
  label,
  isActive,
  busy,
  onSelect,
}: {
  label: string;
  isActive: boolean;
  busy: boolean;
  onSelect: () => void;
}) {
  const { internal, external } = parseTemplateLabel(label);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={busy}
      className={cn(
        'group relative rounded-xl border px-5 py-3 transition-all duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isActive
          ? 'border-primary/50 bg-primary/5 shadow-sm dark:bg-primary/10'
          : 'border-border bg-card hover:border-primary/30 hover:shadow-sm',
      )}
    >
      {/* Grid: Internal (Left) | Arrow (Center) | External (Right) */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full">
        {/* Internal side — centered column */}
        <div className="flex flex-col items-center justify-center gap-0.5 min-w-0">
          <ProtocolColorBadge name={internal.name} subdued={!isActive} />
          {internal.role && <RoleLabel role={internal.role} />}
        </div>

        {/* Center arrow */}
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-150',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
          )}
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </div>

        {/* External side — centered column */}
        <div className="flex flex-col items-center justify-center gap-0.5 min-w-0">
          <ProtocolColorBadge name={external.name} subdued={!isActive} />
          {external.role && <RoleLabel role={external.role} />}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function TemplateSelector({
  selectedTemplateId,
  onTemplateChange,
  onCustomFileSelect,
  busy,
}: TemplateSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCustomFileSelect(file);
      // Reset so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* 3-column grid for templates */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <TemplateBridgeOption
            key={template.id}
            label={template.label}
            isActive={selectedTemplateId === template.id}
            busy={busy}
            onSelect={() => onTemplateChange(template.id)}
          />
        ))}

        {/* Custom file upload fits perfectly as another tile */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className={cn(
            'group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-5 py-3 text-sm font-medium',
            'border-border text-muted-foreground transition-all duration-150',
            'hover:border-primary/50 hover:text-primary hover:bg-primary/5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'md:col-span-2 lg:col-span-3',
          )}
        >
          <UploadCloud className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:-translate-y-0.5" />
          Upload custom file
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".ibmaps,.xlsx"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
