"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImageGallery } from "@/components/store/ImageGallery";
import { VariantSelector } from "@/components/store/VariantSelector";
import { useCart } from "@/lib/store/cart";

interface ProductDetailPageProps {
  params: { slug: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const addItem = useCart((state) => state.addItem);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<any>({});

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/v1/products/${params.slug}`);
      const data = await res.json();

      if (data.success) {
        setProduct(data.data);
        if (data.data.branches?.length > 0) {
          setSelectedBranch(data.data.branches[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const selectedVariantData = product.variants?.find(
      (v: any) => v.id === selectedVariant.variant_id
    );

    addItem({
      product_variant_id: selectedVariantData?.id || product.id,
      quantity,
      product_name: product.name,
      sku: selectedVariantData?.sku || product.id,
      price: selectedVariantData?.price || product.price,
      image_url: product.images?.[0]?.url,
    });

    router.push("/cart");
  };

  const handleAddToWishlist = async () => {
    if (!session) {
      router.push("/login?redirect=/products/" + params.slug);
      return;
    }

    try {
      const res = await fetch("/api/v1/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });

      if (res.ok) {
        alert("Đã thêm vào danh sách yêu thích");
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-slate-500">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy sản phẩm</h2>
          <Button onClick={() => router.push("/products")} className="mt-6">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const branchInventory = product.branches?.find(
    (b: any) => b.id === selectedBranch
  );
  const stockStatus =
    branchInventory?.available_stock > 10
      ? "in_stock"
      : branchInventory?.available_stock > 0
        ? "low_stock"
        : "out_of_stock";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <ImageGallery images={product.images || []} />
        </div>

        <div className="space-y-6">
          <div>
            {product.category && (
              <p className="text-sm uppercase tracking-wide text-slate-500">
                {product.category.name}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{product.name}</h1>

            {product.description && (
              <p className="mt-4 text-slate-600">{product.description}</p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">
              {product.price.toLocaleString("vi-VN")} đ
            </span>
            {stockStatus === "in_stock" && (
              <Badge variant="success">Còn hàng</Badge>
            )}
            {stockStatus === "low_stock" && (
              <Badge variant="warning">Sắp hết</Badge>
            )}
            {stockStatus === "out_of_stock" && (
              <Badge variant="error">Hết hàng</Badge>
            )}
          </div>

          {product.variants && product.variants.length > 0 && (
            <VariantSelector
              variants={product.variant_options || []}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
            />
          )}

          {product.branches && product.branches.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 font-semibold text-slate-900">Chọn chi nhánh</h3>
                <div className="space-y-2">
                  {product.branches.map((branch: any) => (
                    <button
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch.id)}
                      className={`block w-full rounded-lg border p-3 text-left transition ${
                        selectedBranch === branch.id
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{branch.name}</p>
                          <p className="text-sm text-slate-600">{branch.address}</p>
                        </div>
                        <Badge
                          variant={
                            branch.available_stock > 10
                              ? "success"
                              : branch.available_stock > 0
                                ? "warning"
                                : "error"
                          }
                        >
                          {branch.available_stock > 0
                            ? `Còn ${branch.available_stock}`
                            : "Hết hàng"}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-12 w-12 p-0"
              >
                -
              </Button>
              <span className="w-16 text-center text-lg font-semibold">{quantity}</span>
              <Button
                variant="secondary"
                onClick={() => setQuantity(quantity + 1)}
                className="h-12 w-12 p-0"
              >
                +
              </Button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={stockStatus === "out_of_stock"}
              className="flex-1"
            >
              {stockStatus === "out_of_stock" ? "Hết hàng" : "Thêm vào giỏ"}
            </Button>

            <Button variant="secondary" onClick={handleAddToWishlist}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
