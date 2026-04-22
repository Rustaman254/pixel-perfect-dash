import { Box, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const SuiteBanner = () => (
  <section className="bg-brand-yellow">
    <div className="container grid gap-10 py-14 md:grid-cols-2 md:py-16">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-dark/70">All‑in‑one suite</p>
        <div className="mt-3 flex items-center gap-3">
          <Box className="h-7 w-7 text-brand-dark" strokeWidth={1.5} />
          <h2 className="text-3xl font-semibold text-brand-dark">SokoStack One</h2>
        </div>
        <p className="mt-4 max-w-md text-brand-dark/80">
          The operating system for business. Run your entire organization on SokoStack — one unified platform with 50+ apps for every operational need.
        </p>
        <Button variant="red" className="mt-6" asChild>
          <Link to="/products">Try SokoStack One</Link>
        </Button>
      </div>
      <div className="relative md:pl-10">
        <span className="absolute left-0 top-2 hidden h-full w-px bg-brand-dark/15 md:block" />
        <Quote className="h-7 w-7 text-brand-dark" />
        <p className="mt-4 max-w-md text-lg leading-snug text-brand-dark">
          “SokoStack continues to evolve, adapt, and add features in ways that our business sees value in.”
        </p>
        <div className="mt-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-dark/30 to-brand-dark/60" />
          <div>
            <div className="text-sm font-semibold text-brand-dark">Avery Stone</div>
            <div className="text-xs text-brand-dark/70">Chief Operating Officer, Lumera Group</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
