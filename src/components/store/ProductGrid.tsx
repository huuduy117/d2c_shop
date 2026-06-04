import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  stock_status?: "in_stock" | "low_stock" | "out_of_stock";
  discount_price?: number;
}

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = "Không tìm thấy sản phẩm nào",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
