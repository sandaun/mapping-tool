import { Search } from 'lucide-react';

interface LibrarySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function LibrarySearchBar({
  value,
  onChange,
  onKeyDown,
}: LibrarySearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search by manufacturer or model..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
