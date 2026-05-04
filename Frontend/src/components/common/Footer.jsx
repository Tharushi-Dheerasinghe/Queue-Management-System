export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
        <p>© 2026 QueueFlow. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span>Secure</span>
          <span>Reliable</span>
          <span>Multi-Tenant</span>
        </div>
      </div>
    </footer>
  );
}