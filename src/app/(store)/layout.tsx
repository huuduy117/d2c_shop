import { StoreHeader } from "@/components/store/StoreHeader";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <StoreHeader />
      <main>{children}</main>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-slate-600">
            © 2026 D2C Shop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
