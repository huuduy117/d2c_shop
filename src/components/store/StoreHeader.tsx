"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/store/cart";

export function StoreHeader() {
  const { data: session } = useSession();
  const totalItems = useCart((state) => state.getTotalItems());

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-slate-900">
              D2C Shop
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/products"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                Sản phẩm
              </Link>
              <Link
                href="/categories"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                Danh mục
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative">
              <Button variant="secondary">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {totalItems > 0 && (
                  <Badge
                    variant="error"
                    className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full px-1.5 py-0 text-xs"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {session ? (
              <div className="flex items-center gap-3">
                <Link href="/orders">
                  <Button variant="secondary">Đơn hàng</Button>
                </Link>
                <Link href="/wishlist">
                  <Button variant="secondary">Yêu thích</Button>
                </Link>
                <Button variant="secondary" onClick={() => signOut()}>
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="secondary">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary">Đăng ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
