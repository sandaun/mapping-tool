'use client';

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
};

/**
 * Section component with step indicator.
 * Shows a numbered circle to guide users through the workflow.
 */
export function StepSection({
  stepNumber,
  title,
  description,
  children,
  className,
}: StepSectionProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card p-6 shadow-sm',
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-4">
        {/* Step indicator */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-sm font-semibold text-primary"
          aria-label={`Step ${stepNumber}`}
        >
          {stepNumber}
        </div>

        {/* Title and description */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {/* Section content */}
      <div className="ml-12">{children}</div>
    </section>
  );
}
