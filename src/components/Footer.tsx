export function Footer() {
  return (
    <footer className="border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Oriol Carbó. All rights reserved.
      </div>
    </footer>
  );
}
