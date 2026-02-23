/**
 * ProtocolUI — Protocol display UI components.
 *
 *   ProtocolColorBadge        (colored protocol badge with optional subdued mode)
 *   RoleLabel                 (plain text role label)
 *   CollapsedProtocolLabel    (inline bridge for collapsed headers)
 */
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseTemplateLabel } from '@/lib/protocols';
import {
  PROTOCOL_COLOR,
  DEFAULT_PROTOCOL_COLOR,
  PROTOCOL_HOVER_COLOR,
  DEFAULT_HOVER_COLOR,
  SUBDUED_BASE,
} from '@/constants/protocols';

/**
 * Colored badge keyed by protocol name (BACnet=blue, Modbus=amber, KNX=green).
 *
 * When `subdued=true`: renders muted gray by default and transitions to
 * protocol color on hover. Parent element must have the Tailwind `group` class.
 */
export function ProtocolColorBadge({
  name,
  subdued = false,
  className,
}: {
  name: string;
  subdued?: boolean;
  className?: string;
}) {
  const colorClass = subdued
    ? cn(
        SUBDUED_BASE,
        PROTOCOL_HOVER_COLOR[name] ?? DEFAULT_HOVER_COLOR,
        'transition-colors duration-200',
      )
    : (PROTOCOL_COLOR[name] ?? DEFAULT_PROTOCOL_COLOR);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset uppercase tracking-wide',
        colorClass,
        className,
      )}
    >
      {name}
    </span>
  );
}

/** Plain-text role label (Server, Master, etc.) — consistent across all views. */
export function RoleLabel({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'text-[10px] uppercase tracking-wider font-medium text-muted-foreground',
        className,
      )}
    >
      {role}
    </span>
  );
}

/**
 * Inline label for the collapsed StepSection header.
 * Uses colored badges for the protocol name, and plain text for the role.
 */
export function CollapsedProtocolLabel({
  templateLabel,
  className,
}: {
  templateLabel: string;
  className?: string;
}) {
  const { internal, external } = parseTemplateLabel(templateLabel);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1.5">
        <ProtocolColorBadge name={internal.name} />
        {internal.role && <RoleLabel role={internal.role} />}
      </div>
      <ArrowRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
      <div className="flex items-center gap-1.5">
        <ProtocolColorBadge name={external.name} />
        {external.role && <RoleLabel role={external.role} />}
      </div>
    </div>
  );
}
