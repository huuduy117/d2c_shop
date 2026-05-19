import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-10 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col gap-8">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Vietnam D2C</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Nền tảng thương mại điện tử D2C — Web + API-ready
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Phase 0 đã hoàn thiện cấu trúc cơ bản: Next.js App Router, Tailwind, NextAuth, Drizzle ORM, API versioning, PDPA consent và admin middleware.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/register" className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-center transition hover:border-slate-300 hover:bg-slate-100">
              <p className="font-semibold text-slate-900">Đăng ký</p>
            </Link>
            <Link href="/login" className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-center transition hover:border-slate-300 hover:bg-slate-100">
              <p className="font-semibold text-slate-900">Đăng nhập</p>
            </Link>
            <Link href="/admin" className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-center transition hover:border-slate-300 hover:bg-slate-100">
              <p className="font-semibold text-slate-900">Bảng Admin</p>
            </Link>
          </div>

          <div className="grid gap-4 rounded-3xl bg-slate-900 px-6 py-8 text-white sm:grid-cols-3">
            <div>
              <p className="font-semibold">API Versioning</p>
              <p className="mt-2 text-sm text-slate-300">Đã tạo folder /api/v1/ cho các route REST.</p>
            </div>
            <div>
              <p className="font-semibold">DB Schema</p>
              <p className="mt-2 text-sm text-slate-300">Drizzle schema và seed admin / chi nhánh mặc định.</p>
            </div>
            <div>
              <p className="font-semibold">PDPA Consent</p>
              <p className="mt-2 text-sm text-slate-300">Đăng ký yêu cầu đồng ý PDPA và lưu phiên bản điều khoản.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
