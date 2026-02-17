"use client";

import { useTheme } from "@/hooks/useTheme";
import { SunIcon } from "@/components/icons/SunIcon";
import { MoonIcon } from "@/components/icons/MoonIcon";
import Image from "next/image";

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo i títol */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-17 items-center justify-center rounded-lg text-primary-foreground ">
            <Image
              src="/LogoTransparentCut.png"
              alt="Logo"
              width={64}
              height={64}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">SIGNAL AI</h1>
            <p className="text-xs text-muted-foreground">
              Gateweay Mapping Engine
            </p>
          </div>
        </div>

        {/* Toggle dark/light */}
        <div
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-full p-1.5 cursor-pointer transition-all duration-300"
          style={{
            background:
              theme === "light"
                ? "linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #f59e0b, #fbbf24) border-box"
                : theme === "dark"
                  ? "linear-gradient(#1e293b, #1e293b) padding-box, linear-gradient(135deg, #0ea5e9, #06b6d4) border-box"
                  : "linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #e2e8f0, #cbd5e1) border-box",
            border: "2px solid transparent",
          }}
        >
          <SunIcon
            active={theme === "light"}
            className="transition-opacity duration-300"
            style={{ opacity: theme === "light" ? 1 : 0.3 }}
          />
          <MoonIcon
            active={theme === "dark"}
            className="transition-opacity duration-300"
            style={{ opacity: theme === "dark" ? 1 : 0.3 }}
          />
        </div>
      </div>
    </header>
  );
}
