export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div>
        <h2 className="text-2xl font-bold font-space tracking-wide text-foreground">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Application configuration and preferences.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No settings available yet.
      </div>
    </main>
  );
}
