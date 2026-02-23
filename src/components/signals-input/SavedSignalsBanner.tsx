import { Button } from '@/components/ui/button';
import { Save, FolderOpen } from 'lucide-react';

interface SavedSignalsBannerProps {
  onLoadSaved: () => void;
}

export function SavedSignalsBanner({ onLoadSaved }: SavedSignalsBannerProps) {
  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-950/20 p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Save className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm text-blue-800 dark:text-blue-300">
          You have previously parsed signals saved
        </span>
      </div>
      <Button
        onClick={onLoadSaved}
        variant="neutral"
        size="sm"
        className="text-xs"
      >
        <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
        Load saved
      </Button>
    </div>
  );
}
