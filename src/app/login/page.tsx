"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Sparkles, Bell, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<"CZ" | "SK">("CZ");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("bazos:user-session", JSON.stringify({
        nickname: nickname.trim() || "Pikachu Hunter",
        country: selectedCountry,
        loggedInAt: new Date().toISOString(),
      }));
    }
    setTimeout(() => {
      router.push("/");
    }, 400);
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-black">
      {/* 🌟 100dvh Dynamic Background with Lightning & Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Animated Radial Gradients */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-amber-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-yellow-600/15 blur-[100px]" />
        <div className="absolute top-1/3 -left-20 h-[350px] w-[350px] rounded-full bg-amber-400/10 blur-[90px]" />

        {/* Electric Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f59e0b0d_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b0d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* ⚡ Content Container (Centerpiece) */}
      <div className="relative z-10 w-full max-w-md space-y-6 text-center">
        {/* Pikachu Hero Avatar & Sparks */}
        <div className="relative mx-auto flex flex-col items-center">
          <div className="relative h-44 w-44 sm:h-52 sm:w-52 transition-transform duration-500 hover:scale-105">
            {/* Ambient Backlight */}
            <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl animate-pulse" />
            
            {/* High-res Pikachu Official Render */}
            <Image
              src="/images/pikachu-artwork.png"
              alt="Pikachu Bazoš Monitor"
              fill
              priority
              className="object-contain drop-shadow-[0_15px_30px_rgba(245,158,11,0.6)]"
              unoptimized
            />
          </div>

          {/* Electric Badge */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Zap className="h-3.5 w-3.5 fill-amber-400 animate-bounce" />
            <span>PIKACHU EDITION • ULTRA FAST BAZOŠ MONITOR</span>
          </div>
        </div>

        {/* Title and Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Bazoš <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Monitor</span>
          </h1>
          <p className="text-sm text-slate-400">
            Lov na najlepšie inzeráty v ČR a SR rýchlosťou blesku ⚡
          </p>
        </div>

        {/* 🪟 Glassmorphism Login Card */}
        <div className="rounded-2xl border border-amber-500/20 bg-slate-900/60 p-6 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Country Selector Switcher */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-medium text-slate-300">
                Predvolený trh pre vyhľadávanie:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCountry("CZ")}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-sm font-semibold transition-all ${
                    selectedCountry === "CZ"
                      ? "border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span>🇨🇿</span>
                  <span>Bazoš.cz (ČR)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCountry("SK")}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-sm font-semibold transition-all ${
                    selectedCountry === "SK"
                      ? "border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span>🇸🇰</span>
                  <span>Bazoš.sk (SR)</span>
                </button>
              </div>
            </div>

            {/* Hunter Nickname / Name (Optional) */}
            <div className="space-y-1 text-left">
              <label htmlFor="nickname" className="text-xs font-medium text-slate-300">
                Tvoje meno / Prezývka lovca:
              </label>
              <Input
                id="nickname"
                type="text"
                placeholder="napr. Ash Ketchum / Pikachu"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="border-slate-800 bg-slate-950/60 text-white placeholder:text-slate-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
              />
            </div>

            {/* Enter Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 font-bold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] py-6 text-base"
            >
              <Zap className="mr-2 h-5 w-5 fill-slate-950" />
              {isSubmitting ? "Prihlasujem..." : "⚡ Vstúpiť a začať lov"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          {/* Quick Features Highlights */}
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4 text-[11px] text-slate-400">
            <div className="flex flex-col items-center gap-1">
              <Bell className="h-4 w-4 text-amber-400" />
              <span>Live Notifikácie</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Heart className="h-4 w-4 text-rose-400" />
              <span>Obľúbené ponuky</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span>AI Digest</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-slate-500">
          Client-first PWA • 100% Offline podpora • Lokálne úložisko
        </p>
      </div>
    </div>
  );
}
