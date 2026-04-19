import { Link } from "react-router-dom";
import { Quote } from "lucide-react";

export const EnterpriseSection = () => (
  <section className="bg-surface-soft py-16">
    <div className="container grid gap-10 md:grid-cols-2">
      <div>
        <h2 className="text-3xl font-semibold text-brand-dark">Sokostack for Enterprise</h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Discover the ecosystem we've built for large‑scale transformation. Explore our platform capabilities, professional services, and infrastructure.
        </p>
        <Link to="/products" className="mt-5 inline-block text-xs font-semibold uppercase tracking-widest text-primary hover:underline">
          Learn more -&gt;
        </Link>
      </div>
      <div className="md:pl-10">
        <Quote className="h-6 w-6 text-foreground/40" />
        <p className="mt-3 max-w-md text-lg leading-snug text-brand-dark">
          "Sokostack' operating system is a cornerstone of how our team coordinates across the entire business."
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/40 to-brand-primary-light/60" />
          <div>
            <div className="text-sm font-semibold text-brand-dark">Marin de Laure</div>
            <div className="text-xs text-muted-foreground">Co‑founder, Selacent</div>
          </div>
        </div>
        <Link to="/products" className="mt-4 inline-block text-xs font-semibold uppercase tracking-widest text-primary hover:underline">
          Watch video -&gt;
        </Link>
      </div>
    </div>
  </section>
);