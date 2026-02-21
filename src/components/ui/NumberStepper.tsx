import { Minus, Plus } from 'lucide-react';
import { Button } from './button';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  className = '',
}: NumberStepperProps) {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {label && (
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-300 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex items-center rounded-md  ring-1 ring-inset ring-slate-200 dark:ring-slate-600 bg-background shadow-xs divide-x divide-slate-200 dark:divide-slate-600">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDecrement}
          disabled={value <= min}
          className="h-8 w-8 rounded-r-none text-slate-500 dark:text-slate-300 ring-1 ring-inset ring-transparent hover:ring-slate-500 dark:hover:ring-slate-300 hover:bg-slate-50 dark:bg-input/50"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <div className="flex h-8 min-w-10 items-center justify-center px-2 text-sm font-semibold tabular-nums text-slate-500 dark:text-slate-300">
          {value}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleIncrement}
          disabled={value >= max}
          className="h-8 w-8 rounded-l-none text-slate-500 dark:text-slate-300 ring-1 ring-inset ring-transparent hover:ring-slate-500 dark:hover:ring-slate-300 hover:bg-slate-50 dark:bg-input/50"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
