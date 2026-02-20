interface PendingExportBannerProps {
  signalsCount: number;
}

export function PendingExportBanner({
  signalsCount,
}: PendingExportBannerProps) {
  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
      <p className="text-blue-800 dark:text-blue-300">
        {signalsCount} signals pending export
      </p>
    </div>
  );
}
