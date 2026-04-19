import { Box, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const SuiteBanner = () => (
  <section className="bg-primary text-white">
    <div className="container grid gap-10 py-14 md:grid-cols-2 md:py-16">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">All‑in‑one suite</p>
        <div className="mt-3 flex items-center gap-3">
          <Box className="h-7 w-7 text-white" strokeWidth={1.5} />
          <h2 className="text-3xl font-semibold">Sokostack One</h2>
        </div>
        <p className="mt-4 max-w-md text-white/80">
          The operating system for business. Run your entire organization on Sokostack — one unified platform with 50+ apps for every operational need.
        </p>
        <Button variant="default" className="mt-6 bg-white text-primary hover:bg-white/90" asChild>
          <Link to="/products">Try Sokostack One</Link>
        </Button>
      </div>
      <div className="relative md:pl-10">
        <span className="absolute left-0 top-2 hidden h-full w-px bg-white/15 md:block" />
        <Quote className="h-7 w-7 text-white" />
        <p className="mt-4 max-w-md text-lg leading-snug text-white">
          "Sokostack continues to evolve, adapt, and add features in ways that our business sees value in."
        </p>
        <div className="mt-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-white/30 to-white/60" />
          <div>
            <div className="text-sm font-semibold text-white">Avery Stone</div>
            <div className="text-xs text-white/70">Chief Operating Officer, Lumera Group</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);