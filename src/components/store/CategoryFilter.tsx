"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  onCategoryChange: (categorySlug?: string) => void;
  onPriceChange: (min?: number, max?: number) => void;
  onSearchChange: (query: string) => void;
  onReset: () => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  minPrice,
  maxPrice,
  searchQuery = "",
  onCategoryChange,
  onPriceChange,
  onSearchChange,
  onReset,
}: CategoryFilterProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <button
              onClick={() => onCategoryChange(undefined)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                !selectedCategory
                  ? "bg-slate-900 font-semibold text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.slug)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedCategory === category.slug
                    ? "bg-slate-900 font-semibold text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Khoảng giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Giá tối thiểu</Label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice || ""}
                onChange={(e) =>
                  onPriceChange(
                    e.target.value ? Number(e.target.value) : undefined,
                    maxPrice,
                  )
                }
              />
            </div>
            <div>
              <Label>Giá tối đa</Label>
              <Input
                type="number"
                placeholder="10000000"
                value={maxPrice || ""}
                onChange={(e) =>
                  onPriceChange(
                    minPrice,
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="secondary" onClick={onReset} className="w-full">
        Xóa bộ lọc
      </Button>
    </div>
  );
}
