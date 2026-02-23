'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepSectionProps = {
  /** Step number (1, 2, 3...) */
  stepNumber: number;
  /** Section title */
  title: string;
  /** Optional description */
  description?: string;
  /** Section content */
  children: React.ReactNode;
  /** Additional class names for the section container */
  className?: string;
  /** Whether this section can be collapsed */
  collapsible?: boolean;
  /** Controlled collapsed state (only used when collapsible is true) */
  collapsed?: boolean;
  /** Callback when collapsed toggles (only used when collapsible is true) */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Label shown inline when collapsed (e.g. selected template name) */
  collapsedLabel?: React.ReactNode;
};

/**
 * Section component with step indicator.
 * Shows a numbered circle to guide users through the workflow.
 * Uses CSS grid for smooth, reliable collapse/expand animations.
 */
export function StepSection({
  stepNumber,
  title,
  description,
  children,
  className,
  collapsible = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  collapsedLabel,
}: StepSectionProps) {
  const isCollapsed = collapsible && (controlledCollapsed ?? false);

  const handleToggle = () => {
    if (collapsible && onCollapsedChange) {
      onCollapsedChange(!isCollapsed);
    }
  };

  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card p-6 shadow-sm transition-[border-color,box-shadow] duration-300',
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-start gap-4',
          collapsible && 'cursor-pointer select-none',
        )}
        onClick={collapsible ? handleToggle : undefined}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={
          collapsible
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggle();
                }
              }
            : undefined
        }
      >
        {/* Step indicator */}
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300',
            isCollapsed
              ? 'border-secondary/40 bg-secondary/10 text-secondary'
              : 'border-primary/30 bg-primary/10 text-primary',
          )}
          aria-label={`Step ${stepNumber}`}
        >
          {stepNumber}
        </div>

        {/* Title and description */}
        <div className="flex-1 min-w-0">
          <div className="flex min-h-8 items-center gap-3">
            <h2
              className={cn(
                'text-lg font-semibold transition-colors duration-200',
                isCollapsed && 'text-muted-foreground',
              )}
            >
              {title}
            </h2>
            {isCollapsed && collapsedLabel && (
              <div className="flex flex-wrap items-center gap-2">
                {typeof collapsedLabel === 'string' ? (
                  <span className="inline-flex items-center rounded-md bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 transition-opacity duration-300">
                    {collapsedLabel}
                  </span>
                ) : (
                  collapsedLabel
                )}
              </div>
            )}
          </div>
          {description && !isCollapsed && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Chevron indicator for collapsible sections */}
        {collapsible && (
          <ChevronDown
            className={cn(
              'mt-1.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300',
              !isCollapsed && 'rotate-180',
            )}
          />
        )}
      </div>

      {/* Content — CSS grid approach for reliable smooth animation */}
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
          isCollapsed
            ? 'grid-rows-[0fr] opacity-0'
            : 'grid-rows-[1fr] opacity-100',
        )}
      >
        <div className="overflow-hidden">
          <div className={cn('ml-12', !isCollapsed && 'mt-4')}>{children}</div>
        </div>
      </div>
    </section>
  );
}
