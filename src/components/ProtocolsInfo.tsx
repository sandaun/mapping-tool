/**
 * ProtocolsInfo — Protocol display atoms and helpers.
 *
 *   parseTemplateLabel        (pure parsing)
 *   ProtocolColorBadge        (colored protocol badge with optional subdued mode)
 *   RoleLabel                 (plain text role label)
 *   CollapsedProtocolLabel    (inline bridge for collapsed headers)
 */
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Pure parsing helpers
// ---------------------------------------------------------------------------

type ParsedProtocol = {
  name: string;
  role: string | null;
};

type ParsedBridge = {
  internal: ParsedProtocol;
  external: ParsedProtocol;
};

const PROTOCOL_NAMES = ['BACnet', 'Modbus', 'KNX'] as const;
const PROTOCOL_ROLES = ['Server', 'Master', 'Client', 'Slave'] as const;

function parseProtocolPart(part: string): ParsedProtocol {
  const name = PROTOCOL_NAMES.find((p) => part.includes(p)) ?? part.trim();
  const role = PROTOCOL_ROLES.find((r) => part.includes(r)) ?? null;
  return { name, role };
}

/** Parse "BACnet Server → Modbus Master" into structured internal/external data. */
export function parseTemplateLabel(label: string): ParsedBridge {
  const [leftPart = '', rightPart = ''] = label.split(' → ');
  return {
    internal: parseProtocolPart(leftPart),
    external: parseProtocolPart(rightPart),
  };
}

// ---------------------------------------------------------------------------
// Color map (protocol → tailwind classes)
// ---------------------------------------------------------------------------

const PROTOCOL_COLOR: Record<string, string> = {
  BACnet:
    'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800',
  Modbus:
    'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
  KNX: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
};

const DEFAULT_PROTOCOL_COLOR =
  'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';

// Hover-only variants (used when subdued=true — parent must have `group` class)
const PROTOCOL_HOVER_COLOR: Record<string, string> = {
  BACnet:
    'group-hover:bg-sky-100 group-hover:text-sky-700 group-hover:ring-sky-200 dark:group-hover:bg-sky-900/30 dark:group-hover:text-sky-400 dark:group-hover:ring-sky-800',
  Modbus:
    'group-hover:bg-amber-100 group-hover:text-amber-700 group-hover:ring-amber-200 dark:group-hover:bg-amber-900/30 dark:group-hover:text-amber-400 dark:group-hover:ring-amber-800',
  KNX: 'group-hover:bg-emerald-100 group-hover:text-emerald-700 group-hover:ring-emerald-200 dark:group-hover:bg-emerald-900/30 dark:group-hover:text-emerald-400 dark:group-hover:ring-emerald-800',
};

const DEFAULT_HOVER_COLOR =
  'group-hover:bg-slate-100 group-hover:text-slate-700 group-hover:ring-slate-200';

const SUBDUED_BASE = 'bg-muted text-muted-foreground ring-border';

// ---------------------------------------------------------------------------
// Primitive UI atoms
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Composite components
// ---------------------------------------------------------------------------

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
