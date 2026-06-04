"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductGrid } from "@/components/store/ProductGrid";
import { CategoryFilter } from "@/components/store/CategoryFilter";
import { Pagination } from "@/components/store/Pagination";
import { Select } from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const page = Number(searchParams.get("page")) || 1;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || "";
  const minPrice = searchParams.get("min_price")
    ? Number(searchParams.get("min_price"))
    : undefined;
  const maxPrice = searchParams.get("max_price")
    ? Number(searchParams.get("max_price"))
    : undefined;
  const sort = searchParams.get("sort") || "created_at:desc";

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, category, search, minPrice, maxPrice, sort]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/v1/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sort,
      });

      if (category) params.append("category", category);
      if (search) params.append("search", search);
      if (minPrice !== undefined) params.append("min_price", minPrice.toString());
      if (maxPrice !== undefined) params.append("max_price", maxPrice.toString());

      const res = await fetch(`/api/v1/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data.products);
        setTotalPages(data.data.pagination.total_pages);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const handleCategoryChange = (categorySlug?: string) => {
    updateFilters({ category: categorySlug });
  };

  const handlePriceChange = (min?: number, max?: number) => {
    updateFilters({
      min_price: min?.toString(),
      max_price: max?.toString(),
    });
  };

  const handleSearchChange = (query: string) => {
    updateFilters({ search: query });
  };

  const handleSortChange = (newSort: string) => {
    updateFilters({ sort: newSort });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/products?${params.toString()}`);
  };

  const handleReset = () => {
    router.push("/products");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Sản phẩm</h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-64">
          <CategoryFilter
            categories={categories}
            selectedCategory={category}
            minPrice={minPrice}
            maxPrice={maxPrice}
            searchQuery={search}
            onCategoryChange={handleCategoryChange}
            onPriceChange={handlePriceChange}
            onSearchChange={handleSearchChange}
            onReset={handleReset}
          />
        </aside>

        <main className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {loading ? "Đang tải..." : `Trang ${page} / ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Sắp xếp:</label>
              <Select value={sort} onChange={(e) => handleSortChange(e.target.value)}>
                <option value="created_at:desc">Mới nhất</option>
                <option value="created_at:asc">Cũ nhất</option>
                <option value="price:asc">Giá thấp đến cao</option>
                <option value="price:desc">Giá cao đến thấp</option>
                <option value="name:asc">Tên A-Z</option>
                <option value="name:desc">Tên Z-A</option>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-slate-500">Đang tải sản phẩm...</p>
            </div>
          ) : (
            <>
              <ProductGrid products={products} />
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
