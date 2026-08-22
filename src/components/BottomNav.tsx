"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, List, Phone, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Domov", icon: Home },
  { href: "/watches", label: "Sledovania", icon: List },
  { href: "/listings", label: "Inzeráty", icon: Bell },
  { href: "/phones", label: "Telefóny", icon: Phone },
  { href: "/settings", label: "Nastavenia", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-border bg-background/95 pb-safe backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-stretch justify-around px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
