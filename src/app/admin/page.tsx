import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <main className="mx-auto w-full max-w-4xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/50">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Bảng điều khiển Admin</h1>
            <p className="mt-2 text-slate-600">Trang admin cơ bản đã được bảo vệ bởi middleware. Tiếp tục xây dựng dashboard, đơn hàng và tồn kho.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/admin/products" className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-left transition hover:border-slate-300 hover:bg-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">Sản phẩm</h2>
              <p className="mt-2 text-slate-600">Quản lý sản phẩm, biến thể và SEO.</p>
            </Link>
            <Link href="/admin/orders" className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-left transition hover:border-slate-300 hover:bg-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">Đơn hàng</h2>
              <p className="mt-2 text-slate-600">Xem và xử lý trạng thái đơn, chuyển chi nhánh.</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
