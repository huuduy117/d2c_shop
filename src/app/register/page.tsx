"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils/cn";

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      phone: "",
      pdpaConsented: false,
      pdpaVersion: process.env.NEXT_PUBLIC_PDPA_VERSION ?? "v1.0-2026-05-18",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const result = await response.json();
    if (response.ok) {
      setSuccess(true);
      return;
    }

    setServerError(result.error || "Đăng ký không thành công.");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <main className="mx-auto w-full max-w-md rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/50">
        <h1 className="mb-6 text-3xl font-semibold text-slate-900">
          Đăng ký tài khoản
        </h1>
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
            Đăng ký thành công. Vui lòng đăng nhập.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
                  errors.email && "border-rose-500",
                )}
              />
              <p className="mt-1 text-sm text-rose-600">
                {errors.email?.message}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <input
                type="password"
                {...register("password")}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
                  errors.password && "border-rose-500",
                )}
              />
              <p className="mt-1 text-sm text-rose-600">
                {errors.password?.message}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Họ và tên
              </label>
              <input
                type="text"
                {...register("fullName")}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
                  errors.fullName && "border-rose-500",
                )}
              />
              <p className="mt-1 text-sm text-rose-600">
                {errors.fullName?.message}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Số điện thoại
              </label>
              <input
                type="tel"
                {...register("phone")}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
                  errors.phone && "border-rose-500",
                )}
              />
              <p className="mt-1 text-sm text-rose-600">
                {errors.phone?.message}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="pdpaConsented"
                type="checkbox"
                {...register("pdpaConsented")}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
              />
              <div>
                <label
                  htmlFor="pdpaConsented"
                  className="block text-sm font-medium text-slate-700"
                >
                  Tôi đồng ý với điều khoản PDPA
                </label>
                <p className="text-sm text-slate-500">
                  Bạn phải đồng ý để tạo tài khoản.
                </p>
              </div>
            </div>
            <input type="hidden" {...register("pdpaVersion")} />

            {serverError && (
              <p className="text-sm text-rose-600">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Đang xử lý…" : "Đăng ký"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
