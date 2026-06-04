import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductGrid } from "@/components/store/ProductGrid";

async function getFeaturedProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/v1/products?limit=8&sort=created_at:desc`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data.products || [];
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

async function getCategories() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/v1/categories`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function StorePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-12 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-12 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Chào mừng đến D2C Shop
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Mua sắm trực tuyến với giá tốt nhất. Giao hàng nhanh chóng, thanh toán an toàn.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/products">
              <Button variant="primary" className="bg-white text-slate-900 hover:bg-slate-100">
                Mua sắm ngay
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="secondary" className="border-white text-white hover:bg-white/10">
                Xem danh mục
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Danh mục sản phẩm</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category: any) => (
              <Link key={category.id} href={`/products?category=${category.slug}`}>
                <Card className="transition hover:border-slate-300 hover:shadow-md">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-semibold text-slate-900">{category.name}</h3>
                    {category.description && (
                      <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Sản phẩm mới</h2>
          <Link href="/products">
            <Button variant="secondary">Xem tất cả</Button>
          </Link>
        </div>
        <ProductGrid products={featuredProducts} emptyMessage="Chưa có sản phẩm nào" />
      </section>
    </div>
  );
}
