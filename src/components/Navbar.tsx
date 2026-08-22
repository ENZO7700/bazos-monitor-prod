"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Plus,
  Home,
  List,
  Bell,
  Heart,
  Phone,
  Settings,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const navSections = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/watches", label: "Sledovania", icon: List },
  { href: "/listings", label: "Inzeráty", icon: Bell },
  { href: "/favorites", label: "❤️ Obľúbené", icon: Heart },
  { href: "/phones", label: "Telefóny", icon: Phone },
  { href: "/settings", label: "Nastavenia", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-safe backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex min-h-11 min-w-11 items-center gap-2 font-bold"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            B
          </span>
          <span className="inline">Bazoš Monitor</span>
        </Link>

        {/* Desktop & Tablet Navigation (All sections visible) */}
        <nav className="hidden items-center gap-1 md:flex">
          {navSections.map(({ href, label }) => {
            const active =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors font-medium",
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

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Pikachu Quick Profile Button */}
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/20 hover:scale-105"
            title="Pikachu Login & Profil"
          >
            <Zap className="h-3.5 w-3.5 fill-amber-400" />
            <span className="hidden sm:inline">Pikachu</span>
          </Link>

          {/* New Watch Button */}
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/watches/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Nové sledovanie
            </Link>
          </Button>

          {/* Mobile / Tablet Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent md:hidden"
            aria-label={mobileMenuOpen ? "Zatvoriť menu" : "Otvoriť menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 📱 Mobile & Tablet Expandable Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background/98 px-4 py-5 shadow-2xl backdrop-blur-xl md:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            {/* Header / Hunter Profile */}
            <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                  <Zap className="h-4 w-4 fill-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pikachu Edition</div>
                  <div className="text-[10px] text-muted-foreground">Bazoš Monitor PWA</div>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 text-amber-400">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Profil
                </Link>
              </Button>
            </div>

            {/* Všetky hlavné sekcie */}
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hlavné sekcie
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {navSections.map(({ href, label, icon: Icon }) => {
                  const active =
                    pathname === href || (href !== "/" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted/50 text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Rýchle sledovanie novej položky */}
            <Button asChild className="w-full justify-center">
              <Link href="/watches/new" onClick={() => setMobileMenuOpen(false)}>
                <Plus className="mr-2 h-4 w-4" />
                Vytvoriť nové sledovanie
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
