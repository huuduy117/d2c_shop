"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/store/cart";

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  stock_status?: "in_stock" | "low_stock" | "out_of_stock";
  discount_price?: number;
}

export function ProductCard({
  id,
  slug,
  name,
  price,
  image_url,
  category,
  stock_status = "in_stock",
  discount_price,
}: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      product_variant_id: id,
      quantity: 1,
      product_name: name,
      sku: id,
      price: discount_price || price,
      image_url,
    });
  };

  const isOutOfStock = stock_status === "out_of_stock";
  const hasDiscount = discount_price && discount_price < price;

  return (
    <Link
      href={`/products/${slug}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <span>No image</span>
          </div>
        )}
        {hasDiscount && (
          <Badge variant="error" className="absolute right-2 top-2">
            -{Math.round(((price - discount_price) / price) * 100)}%
          </Badge>
        )}
        {stock_status === "low_stock" && (
          <Badge variant="warning" className="absolute left-2 top-2">
            Sắp hết
          </Badge>
        )}
        {isOutOfStock && (
          <Badge variant="error" className="absolute left-2 top-2">
            Hết hàng
          </Badge>
        )}
      </div>

      <div className="mt-4">
        {category && (
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {category}
          </p>
        )}
        <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-slate-700">
          {name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-red-600">
                {discount_price.toLocaleString("vi-VN")} đ
              </span>
              <span className="text-sm text-slate-400 line-through">
                {price.toLocaleString("vi-VN")} đ
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-slate-900">
              {price.toLocaleString("vi-VN")} đ
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className="mt-4 w-full"
        variant={isOutOfStock ? "secondary" : "primary"}
      >
        {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
      </Button>
    </Link>
  );
}
