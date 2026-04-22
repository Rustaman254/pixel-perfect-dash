import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search, Globe } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { megaMenus, MegaMenuPanel } from "./MegaMenu";

const nav = ["Products", "Customers", "Partners", "Resources"] as const;

export const SiteHeader = () => {
  const [open, setOpen] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  const handleEnter = (item: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(item);
  };
  const handleLeave = () => {
    closeTimer.current = window.setTimeout(() => setOpen(null), 120);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" onMouseLeave={handleLeave}>
            {nav.map((item) => (
              <button
                key={item}
                type="button"
                onMouseEnter={() => handleEnter(item)}
                onFocus={() => handleEnter(item)}
                aria-expanded={open === item}
                className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  open === item ? "text-brand-red" : "text-foreground/80 hover:text-brand-red"
                }`}
              >
                {item}
                <ChevronDown
                  className={`h-3.5 w-3.5 opacity-60 transition-transform ${
                    open === item ? "rotate-180" : ""
                  }`}
                />
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button aria-label="Search" className="text-foreground/70 hover:text-foreground">
            <Search className="h-4 w-4" />
          </button>
          <button className="hidden items-center gap-1 text-sm text-foreground/70 hover:text-foreground sm:flex">
            <Globe className="h-4 w-4" />
            English
          </button>
          <Link to="/products" className="text-sm font-medium text-brand-red hover:underline">
            Sign in
          </Link>
          <Button asChild variant="outlineRed" size="sm">
            <Link to="/products">Sign up</Link>
          </Button>
        </div>
      </div>

      {open && megaMenus[open] && (
        <div
          onMouseEnter={() => handleEnter(open)}
          onMouseLeave={handleLeave}
          className="absolute inset-x-0 top-full hidden border-t border-border bg-background shadow-card animate-in fade-in slide-in-from-top-2 md:block"
        >
          <MegaMenuPanel content={megaMenus[open]} />
        </div>
      )}
    </header>
  );
};
