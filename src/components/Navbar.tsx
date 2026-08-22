"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const desktopLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/watches", label: "Sledovania" },
  { href: "/listings", label: "Inzeráty" },
  { href: "/phones", label: "Telefóny" },
  { href: "/settings", label: "Nastavenia" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-safe backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
        <Link href="/" className="flex min-h-11 min-w-11 items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            B
          </span>
          <span className="hidden sm:inline">Bazoš Monitor</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {desktopLinks.map(({ href, label }) => {
            const active =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Button asChild size="sm" className="md:hidden">
          <Link href="/watches/new" aria-label="Nové sledovanie">
            <Plus className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
