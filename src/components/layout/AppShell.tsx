"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main id="main-content">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <OfflineBanner />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 pb-24 pt-safe md:py-8 md:pb-8">
        {children}
      </main>
      <BottomNav />
    </>
  );
}

