"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AppHeader from "@/components/layout/AppHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] dark:bg-[#0f0f0f]">
        Carregando...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F9F8F6] dark:bg-[#0f0f0f] text-[#1C1C19] dark:text-[#f0f0f0]">
      <AppHeader />
      <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">{children}</main>
    </div>
  );
}
