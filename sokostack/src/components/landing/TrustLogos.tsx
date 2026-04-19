import { Link } from "react-router-dom";

const brands = ["NORTHWIND", "ACME", "Lumera", "Vertex", "HALCYON", "Orbital"];

export const TrustLogos = () => (
  <section className="bg-background py-14">
    <div className="container text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Brands that trust us</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {brands.map((b) => (
          <span key={b} className="text-xl font-semibold tracking-wider text-foreground/70">
            {b}
          </span>
        ))}
      </div>
      <Link to="/products" className="mt-6 inline-block text-xs font-semibold uppercase tracking-widest text-primary hover:underline">
        Customer stories ›
      </Link>
    </div>
  </section>
);
