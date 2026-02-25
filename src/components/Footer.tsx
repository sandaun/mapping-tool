export function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-4 text-center text-xs text-muted-foreground">
        Copyright &copy; {new Date().getFullYear()} HMS Networks. All rights
        reserved.
      </div>
    </footer>
  );
}
