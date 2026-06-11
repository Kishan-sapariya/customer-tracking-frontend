import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Toaster } from "@/components/Toaster";

// Protected shell: auth guard + sidebar + topbar + toaster (PRD §8.3).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* Fixed app shell: the outer row is exactly viewport-height and doesn't
          scroll. Sidebar + Topbar stay pinned; only <main> scrolls. */}
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
        <Toaster />
      </div>
    </AuthGuard>
  );
}
