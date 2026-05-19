"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { cn } from "@/lib/utils/cn";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    const result = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
      callbackUrl: "/",
    });

    if (result?.error) {
      setError("Đăng nhập không thành công. Vui lòng kiểm tra email và mật khẩu.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <main className="mx-auto w-full max-w-md rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/50">
        <h1 className="mb-6 text-3xl font-semibold text-slate-900">Đăng nhập</h1>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" {...register("email")} className={cn("w-full rounded-xl border px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200", errors.email && "border-rose-500")} />
            <p className="mt-1 text-sm text-rose-600">{errors.email?.message}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu</label>
            <input type="password" {...register("password")} className={cn("w-full rounded-xl border px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200", errors.password && "border-rose-500")} />
            <p className="mt-1 text-sm text-rose-600">{errors.password?.message}</p>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Đang xử lý…" : "Đăng nhập"}
          </button>
        </form>
      </main>
    </div>
  );
}
