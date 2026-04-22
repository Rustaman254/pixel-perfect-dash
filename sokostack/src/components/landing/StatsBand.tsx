import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const stats = [
  { v: "150M+", l: "Users worldwide" },
  { v: "150+", l: "Countries served" },
  { v: "19K+", l: "Employees worldwide" },
  { v: "30+", l: "Years in business" },
  { v: "60+", l: "Products" },
];

export const StatsBand = () => (
  <section className="relative overflow-hidden bg-brand-blue text-brand-blue-foreground">
    {/* decorative outline */}
    <svg
      className="absolute right-0 top-1/2 hidden h-72 -translate-y-1/2 opacity-20 md:block"
      viewBox="0 0 300 200" fill="none" stroke="currentColor" strokeWidth="1.2"
      aria-hidden="true"
    >
      <path d="M20 180 L60 80 L100 180 M70 130 H90 M120 180 V80 H180 V180 M140 110 H160 M200 180 V60 L240 30 L280 60 V180 M220 120 H260" />
    </svg>

    <div className="container py-20 text-center">
      <h2 className="text-3xl font-semibold md:text-4xl">
        Business Software.
        <br />
        Our Craft. Our Passion.
      </h2>
      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-y-8 sm:grid-cols-3 md:grid-cols-5">
        {stats.map((s) => (
          <div key={s.l}>
            <div className="text-3xl font-semibold">{s.v}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-white/75">{s.l}</div>
          </div>
        ))}
      </div>
      <Button variant="outline" className="mt-10 border-white/60 bg-transparent text-brand-blue-foreground hover:bg-white hover:text-brand-blue" asChild>
        <Link to="/products">More about SokoStack</Link>
      </Button>
    </div>
  </section>
);
