import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        // Custom action variants
        'primary-action':
          'border border-slate-200 bg-primary/5 shadow-xs text-primary hover:border-primary hover:bg-primary/10 hover:text-primary dark:bg-primary/10 dark:border-input dark:hover:bg-primary/15',
        'secondary-action':
          'border border-slate-200 bg-secondary/10 shadow-xs text-secondary hover:border-secondary hover:bg-secondary/15 hover:text-secondary dark:bg-secondary/15 dark:border-input dark:hover:bg-secondary/20',
        neutral:
          'border bg-slate-50 shadow-xs text-slate-500 border-slate-200 hover:text-slate-500 hover:border-slate-500 dark:text-slate-300 dark:border-slate-600 dark:bg-input/30 font-semibold hover:dark:border-slate-300 hover:dark:text-slate-300 dark:hover:bg-input/50',
        danger:
          'border shadow-xs text-red-400 border border-slate-200 bg-red-400/10 hover:border-red-400 hover:text-red-400 hover:bg-red-400/15 dark:bg-red-400/15 dark:border-input dark:hover:border-red-400 dark:hover:bg-red-400/15',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
